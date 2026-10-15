import { useEffect, useRef } from "react"
import { ChatAgentSelector } from "./chat-agent-selector"
import type { ChatMode } from "./chat-mode-toggle"
import { ChatModelSelector } from "./chat-model-selector"
import { ChatToolbar } from "./chat-toolbar"
import type { AgentSummary } from "../services/get-agents"
import type { ProvidersOffering } from "../services/get-models"
import type { ProviderConfiguration } from "../services/get-provider-configuration"
import type { Mcp } from "../services/get-mcps"
import type { ModelParameters } from "../services/stream-agent"
import type { ModelSamplingSupport } from "../services/get-model-sampling"

type ChatInputProps = {
    input: string
    onInputChange: (value: string) => void
    onSend: () => void
    loading: boolean
    mode: ChatMode
    onModeChange: (mode: ChatMode) => void
    offerings: ProvidersOffering | null
    providerConfigs: ProviderConfiguration[]
    provider: string
    model: string
    onModelSelect: (provider: string, model: string) => void
    agents: AgentSummary[] | null
    agentId: string | null
    onAgentSelect: (agentId: string) => void
    mcps: Mcp[]
    selectedMcps: string[]
    onMcpToggle: (mcpName: string) => void
    userVsFiles: boolean
    onUserVsFilesToggle: () => void
    userVsMemories: boolean
    onUserVsMemoriesToggle: () => void
    userVsSkills: boolean
    onUserVsSkillsToggle: () => void
    webSearch: boolean
    onWebSearchToggle: () => void
    parameters: ModelParameters
    onParametersChange: (parameters: ModelParameters) => void
    samplingSupport: ModelSamplingSupport | null
}

export function ChatInput({
    input,
    onInputChange,
    onSend,
    loading,
    mode,
    onModeChange,
    offerings,
    providerConfigs,
    provider,
    model,
    onModelSelect,
    agents,
    agentId,
    onAgentSelect,
    mcps,
    selectedMcps,
    onMcpToggle,
    userVsFiles,
    onUserVsFilesToggle,
    userVsMemories,
    onUserVsMemoriesToggle,
    userVsSkills,
    onUserVsSkillsToggle,
    webSearch,
    onWebSearchToggle,
    parameters,
    onParametersChange,
    samplingSupport,
}: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        autoResize()
    }, [input])

    function autoResize() {
        const el = textareaRef.current
        
        if (!el) return
        el.style.height = "auto"
        el.style.height = Math.min(el.scrollHeight, 200) + "px"
    }

    const agentName = agents?.find((a) => a.id === agentId)?.name
    const hasTarget = mode === "agent" ? !!agentId : !!model
    const canSend = input.trim() && !loading && hasTarget

    function handleSend() {
        if (!canSend) return
        onSend()
        // Dismiss the on-screen keyboard on touch devices; keep focus on desktop
        if (window.matchMedia("(pointer: coarse)").matches) {
            textareaRef.current?.blur()
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="shrink-0 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
            <div className="mx-auto max-w-2xl rounded-2xl border border-ui-700/60 bg-ui-900 p-2.5 shadow-lg shadow-black/5 dark:shadow-black/40">
                <ChatToolbar
                    mode={mode}
                    onModeChange={onModeChange}
                    agentName={agentName}
                    mcps={mcps}
                    selectedMcps={selectedMcps}
                    onMcpToggle={onMcpToggle}
                    userVsFiles={userVsFiles}
                    onUserVsFilesToggle={onUserVsFilesToggle}
                    userVsMemories={userVsMemories}
                    onUserVsMemoriesToggle={onUserVsMemoriesToggle}
                    userVsSkills={userVsSkills}
                    onUserVsSkillsToggle={onUserVsSkillsToggle}
                    webSearch={webSearch}
                    onWebSearchToggle={onWebSearchToggle}
                    parameters={parameters}
                    onParametersChange={onParametersChange}
                    samplingSupport={samplingSupport}
                />
                <div className="rounded-xl border border-transparent bg-ui-800 transition-colors focus-within:border-brand-500/50">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => onInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Send a message..."
                        rows={1}
                        className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-base text-ui-100 placeholder-ui-500 outline-none sm:text-sm"
                    />
                    <div className="flex items-center justify-between px-2 pb-2.5">
                        <div className="flex min-w-0 items-center gap-1">
                            {mode === "agent" ? (
                                <ChatAgentSelector
                                    agents={agents}
                                    selectedAgentId={agentId}
                                    onSelect={onAgentSelect}
                                />
                            ) : offerings ? (
                                <ChatModelSelector
                                    offerings={offerings}
                                    providerConfigs={providerConfigs}
                                    selectedProvider={provider}
                                    selectedModel={model}
                                    onSelect={onModelSelect}
                                />
                            ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-ui-500">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500/60" />
                                    Loading models...
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!canSend}
                            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-flame text-ui-950 shadow-md shadow-brand-500/20 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
