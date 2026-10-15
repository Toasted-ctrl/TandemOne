import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "../components/app-header"
import { ChatInput } from "../components/chat-input"
import { ChatWindow, type Message, type ContentBlock, type ToolBlock } from "../components/chat-window"
import type { ChatMode } from "../components/chat-mode-toggle"
import { getAgents, type AgentSummary } from "../services/get-agents"
import { getProviderModels, type ProvidersOffering } from "../services/get-models"
import { getProviderConfiguration, type ProviderConfiguration } from "../services/get-provider-configuration"
import { getMcps, type Mcp } from "../services/get-mcps"
import { getModelSampling, type ModelSamplingSupport } from "../services/get-model-sampling"
import { getUser, type User } from "../services/get-user"
import { streamAgent, type ModelParameters } from "../services/stream-agent"

const GREETINGS: ((name: string) => string)[] = [
    (name) => `Hi ${name}!`,
    (name) => `Hello ${name}!`,
    (name) => `Welcome back, ${name}!`,
    (name) => `Good to see you, ${name}!`,
    (name) => `Hey ${name}, what's on your mind?`,
    (name) => `Hallo ${name}!`,
    (name) => `Hoi ${name}!`,
    (name) => `Hola ${name}!`,
    (name) => `Bonjour ${name}!`,
    (name) => `Ciao ${name}!`,
    (name) => `Olá ${name}!`,
    (name) => `Hej ${name}!`,
    (name) => `Moin ${name}!`,
    (name) => `Salut ${name}!`,
    (name) => `Kia ora ${name}!`,
    (name) => `Aloha ${name}!`,
    (name) => `Merhaba ${name}!`,
    (name) => `Cześć ${name}!`,
    (name) => `Привет, ${name}!`,
    (name) => `Γειά σου ${name}!`,
    (name) => `こんにちは、${name}さん!`,
    (name) => `안녕하세요, ${name}님!`,
    (name) => `你好, ${name}!`,
    (name) => `नमस्ते ${name}!`,
    (name) => `مرحبا ${name}!`,
    (name) => `שלום ${name}!`,
    (name) => `Jambo ${name}!`,
    (name) => `Sawubona ${name}!`,
]

function randomGreeting() {
    return GREETINGS[Math.floor(Math.random() * GREETINGS.length)]
}

export function ChatPage() {
    const navigate = useNavigate()
    const [user, setUser] = useState<User | null>(null)
    const [offerings, setOfferings] = useState<ProvidersOffering | null>(null)
    const [providerConfigs, setProviderConfigs] = useState<ProviderConfiguration[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<ChatMode>("model")
    const [provider, setProvider] = useState("")
    const [model, setModel] = useState("")
    // Null until the list is first fetched
    const [agents, setAgents] = useState<AgentSummary[] | null>(null)
    const [agentId, setAgentId] = useState<string | null>(null)
    const [mcps, setMcps] = useState<Mcp[]>([])
    const [selectedMcps, setSelectedMcps] = useState<string[]>([])
    const [userVsFiles, setUserVsFiles] = useState(false)
    const [userVsMemories, setUserVsMemories] = useState(false)
    const [userVsSkills, setUserVsSkills] = useState(false)
    const [webSearch, setWebSearch] = useState(false)
    const [parameters, setParameters] = useState<ModelParameters>({ temperature: null, top_p: null, top_k: null })
    const [samplingSupport, setSamplingSupport] = useState<ModelSamplingSupport | null>(null)
    const [threadId, setThreadId] = useState<string | null>(null)
    const [greeting, setGreeting] = useState(randomGreeting)
    const abortRef = useRef<AbortController | null>(null)

    useEffect(() => {
        getUser()
            .then(setUser)
            .catch(() => navigate("/login", { replace: true }))
    }, [navigate])

    useEffect(() => {
        getProviderModels().then(setOfferings).catch(console.error)
        getProviderConfiguration().then((res) => setProviderConfigs(res.providers)).catch(console.error)
        getMcps().then((res) => setMcps(res.mcps)).catch(console.error)
    }, [])

    useEffect(() => {
        setSamplingSupport(null)
        if (!provider || !model) return

        let cancelled = false
        getModelSampling(provider, model)
            .then((res) => {
                if (cancelled) return
                setSamplingSupport(res.sampling)
                // Drop values the new model can't accept so they aren't sent with the request
                setParameters((prev) => ({
                    temperature: res.sampling.temperature ? prev.temperature : null,
                    top_p: res.sampling.top_p ? prev.top_p : null,
                    top_k: res.sampling.top_k ? prev.top_k : null,
                }))
            })
            .catch(console.error)
        return () => { cancelled = true }
    }, [provider, model])

    function handleModeChange(next: ChatMode) {
        setMode(next)
        if (next !== "agent") return

        // Refetch on every switch so newly created or shared agents show up
        getAgents("All")
            .then((res) => {
                setAgents(res.agents)
                // Drop the selection if the agent is no longer available
                setAgentId((prev) => prev && res.agents.some((a) => a.id === prev) ? prev : null)
            })
            .catch((err) => {
                console.error(err)
                setAgents((prev) => prev ?? [])
            })
    }

    const agentName = agents?.find((a) => a.id === agentId)?.name
    const assistantName = mode === "agent" ? agentName : model || undefined

    async function handleSend() {
        const text = input.trim()
        if (!text || loading) return
        if (mode === "agent" ? !agentId : !provider || !model) return

        const userMessage: Message = { role: "user", content: text }
        setMessages((prev) => [...prev, userMessage])
        setInput("")
        setLoading(true)

        setMessages((prev) => [...prev, { role: "assistant", content: "", blocks: [{ type: "text", text: "" }], assistantName }])

        const controller = new AbortController()
        abortRef.current = controller

        function appendBlock(block: ContentBlock) {
            setMessages((prev) => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                const blocks = [...(last.blocks ?? [])]
                blocks.push(block)
                updated[updated.length - 1] = { ...last, blocks }
                return updated
            })
        }

        // Updates the latest tool block matching `match`, or appends `fallback` if there is none
        function updateToolBlock(
            match: (b: ToolBlock) => boolean,
            update: (b: ToolBlock) => ToolBlock,
            fallback?: ToolBlock,
        ) {
            setMessages((prev) => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                const blocks = [...(last.blocks ?? [])]
                const at = blocks.findLastIndex((b) => b.type === "tool" && match(b))
                const block = blocks[at]
                if (block?.type === "tool") blocks[at] = update(block)
                else if (fallback) blocks.push(fallback)
                else return prev
                updated[updated.length - 1] = { ...last, blocks }
                return updated
            })
        }

        try {
            const mcpToolIds = selectedMcps
                .map((name) => mcps.find((m) => m.name === name)?.id)
                .filter((id): id is string => !!id)

            await streamAgent(
                mode === "agent" && agentId
                    ? { threadId, agentId, prompt: text }
                    : {
                        threadId,
                        provider,
                        model,
                        prompt: text,
                        parameters,
                        mcpTools: mcpToolIds,
                        userVsFiles,
                        userVsMemories,
                        userVsSkills,
                        webSearch,
                    },
                {
                    onChunk: (chunk) => {
                        setMessages((prev) => {
                            const updated = [...prev]
                            const last = updated[updated.length - 1]
                            const blocks = [...(last.blocks ?? [])]
                            const lastBlock = blocks[blocks.length - 1]
                            if (lastBlock?.type === "text") {
                                blocks[blocks.length - 1] = { ...lastBlock, text: lastBlock.text + chunk }
                            } else {
                                blocks.push({ type: "text", text: chunk })
                            }
                            updated[updated.length - 1] = {
                                ...last,
                                content: last.content + chunk,
                                blocks,
                            }
                            return updated
                        })
                    },
                    onToolCall: (id, name, args) => {
                        appendBlock({ type: "tool", id, name, input: args, status: "running", startedAt: Date.now() })
                    },
                    onToolCallArgs: (id, args) => {
                        updateToolBlock(
                            (b) => b.id === id,
                            (b) => ({ ...b, input: b.input + args }),
                        )
                    },
                    onToolResult: (id, name, output, isError) => {
                        const status = isError ? "error" : "success"
                        updateToolBlock(
                            // Without an id, pair with the latest running call of the same tool
                            (b) => (id ? b.id === id : b.name === name && b.status === "running"),
                            (b) => ({ ...b, output, status, finishedAt: Date.now() }),
                            { type: "tool", id, name, input: "", output, status },
                        )
                    },
                    onThreadId: (id) => setThreadId(id),
                },
                controller.signal,
            )
        } catch (err) {
            if ((err as Error).name !== "AbortError") {
                setMessages((prev) => {
                    const updated = [...prev]
                    const last = updated[updated.length - 1]
                    if (!last.content) {
                        updated[updated.length - 1] = {
                            ...last,
                            content: `Error: ${(err as Error).message}`,
                        }
                    }
                    return updated
                })
            }
        } finally {
            // Any call still waiting when the stream ends never got a result
            setMessages((prev) => {
                const last = prev[prev.length - 1]
                if (!last?.blocks?.some((b) => b.type === "tool" && b.status === "running")) return prev
                const blocks = last.blocks.map((b) =>
                    b.type === "tool" && b.status === "running"
                        ? { ...b, status: "error" as const, output: b.output ?? "No result received." }
                        : b,
                )
                return [...prev.slice(0, -1), { ...last, blocks }]
            })
            abortRef.current = null
            setLoading(false)
        }
    }

    return (
        <div className="flex h-svh flex-col bg-ui-950 bg-grid">
            <AppHeader
                showNewChat={messages.length > 0}
                onNewChat={() => {
                    if (loading) abortRef.current?.abort()
                    setMessages([])
                    setThreadId(null)
                    setLoading(false)
                    setGreeting(randomGreeting)
                }}
            />

            <ChatWindow
                messages={messages}
                loading={loading}
                greeting={user ? greeting(user.first_name) : undefined}
                greetingName={user?.first_name}
                assistantName={assistantName}
            />

            <ChatInput
                input={input}
                onInputChange={setInput}
                onSend={handleSend}
                loading={loading}
                mode={mode}
                onModeChange={handleModeChange}
                offerings={offerings}
                providerConfigs={providerConfigs}
                provider={provider}
                model={model}
                onModelSelect={(p, m) => { setProvider(p); setModel(m) }}
                agents={agents}
                agentId={agentId}
                onAgentSelect={setAgentId}
                mcps={mcps}
                selectedMcps={selectedMcps}
                onMcpToggle={(name) =>
                    setSelectedMcps((prev) =>
                        prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
                    )
                }
                userVsFiles={userVsFiles}
                onUserVsFilesToggle={() => setUserVsFiles((v) => !v)}
                userVsMemories={userVsMemories}
                onUserVsMemoriesToggle={() => setUserVsMemories((v) => !v)}
                userVsSkills={userVsSkills}
                onUserVsSkillsToggle={() => setUserVsSkills((v) => !v)}
                webSearch={webSearch}
                onWebSearchToggle={() => setWebSearch((v) => !v)}
                parameters={parameters}
                onParametersChange={setParameters}
                samplingSupport={samplingSupport}
            />
        </div>
    )
}
