import { useEffect, useRef } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { LogoMark } from "./logo"
import { ThinkingIndicator } from "./thinking-indicator"

export type ToolStatus = "running" | "success" | "error"

// A tool call and its result, rendered together like a command and its output
export type ToolBlock = {
    type: "tool"
    id?: string
    name: string
    input: string
    output?: string
    status: ToolStatus
    startedAt?: number
    finishedAt?: number
}

export type ContentBlock =
    | { type: "text"; text: string }
    | ToolBlock

export type Message = {
    role: "user" | "assistant"
    content: string
    blocks?: ContentBlock[]
    // Model (or, later, agent) name that produced an assistant message
    assistantName?: string
}

type ChatWindowProps = {
    messages: Message[]
    loading: boolean
    greeting?: string
    // Highlighted within the greeting
    greetingName?: string
    assistantName?: string
}

function AssistantAvatar({ working }: { working?: boolean }) {
    return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ui-700/60 bg-ui-900">
            <LogoMark className="h-4 w-5" animated={working} />
        </div>
    )
}

function Greeting({ text, name }: { text: string; name?: string }) {
    const at = name ? text.indexOf(name) : -1
    if (!name || at < 0) return <>{text}</>

    // Colour the name plus any punctuation that directly follows it, e.g. "Mick!"
    const tail = text.slice(at + name.length).match(/^[!,.?]*/)?.[0] ?? ""
    const end = at + name.length + tail.length
    return (
        <>
            {text.slice(0, at)}
            <span className="text-brand-500">{text.slice(at, end)}</span>
            {text.slice(end)}
        </>
    )
}

// Keys most likely to hold the argument worth showing on the command line
const PRIMARY_ARG_KEYS = ["query", "q", "search", "url", "path", "command", "name", "text", "prompt"]

function commandArgs(input: string) {
    const raw = input.trim()
    if (!raw) return ""
    try {
        const parsed = JSON.parse(raw)
        if (typeof parsed === "string") return JSON.stringify(parsed)
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            const entries = Object.entries(parsed as Record<string, unknown>)
            if (entries.length === 0) return ""
            const key = PRIMARY_ARG_KEYS.find((k) => typeof parsed[k] === "string")
                ?? entries.find(([, v]) => typeof v === "string")?.[0]
            if (key) return JSON.stringify(parsed[key])
            return JSON.stringify(parsed)
        }
        return JSON.stringify(parsed)
    } catch {
        return raw.replace(/\s+/g, " ")
    }
}

function isTextPart(value: unknown): value is { type: "text"; text: string } {
    return !!value && typeof value === "object"
        && (value as Record<string, unknown>).type === "text"
        && typeof (value as Record<string, unknown>).text === "string"
}

// Tool payloads are often JSON encoded more than once, or wrapped in MCP-style
// [{ type: "text", text: "..." }] parts; peel those layers off so it reads as plain JSON
function unwrapJson(value: unknown, depth = 0): unknown {
    if (depth > 8) return value
    if (typeof value === "string") {
        const text = value.trim()
        if (!/^[[{"]/.test(text)) return value
        try {
            return unwrapJson(JSON.parse(text), depth + 1)
        } catch {
            return value
        }
    }
    if (Array.isArray(value)) {
        if (value.length > 0 && value.every(isTextPart)) {
            const parts = value.map((part) => unwrapJson(part.text, depth + 1))
            if (parts.length === 1) return parts[0]
            return parts.every((p) => typeof p === "string") ? parts.join("\n\n") : parts
        }
        return value.map((item) => unwrapJson(item, depth + 1))
    }
    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, unwrapJson(v, depth + 1)]),
        )
    }
    return value
}

function formatToolText(text: string) {
    const value = unwrapJson(text)
    return typeof value === "string" ? value : JSON.stringify(value, null, 2)
}

function formatDuration(ms: number) {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

const STATUS_STYLES: Record<ToolStatus, { border: string; dot: string; text: string }> = {
    running: { border: "border-l-brand-400", dot: "bg-brand-400 animate-pulse", text: "text-brand-400" },
    success: { border: "border-l-green-400", dot: "bg-green-400", text: "text-green-400" },
    error: { border: "border-l-red-400", dot: "bg-red-400", text: "text-red-400" },
}

function ToolCallBlock({ block }: { block: ToolBlock }) {
    const styles = STATUS_STYLES[block.status]
    const args = commandArgs(block.input)
    const duration = block.startedAt && block.finishedAt
        ? formatDuration(block.finishedAt - block.startedAt)
        : null

    return (
        <details className={`group my-2 overflow-hidden rounded-lg border border-l-2 border-ui-700/60 bg-ui-950 font-mono text-xs ${styles.border}`}>
            <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 select-none hover:bg-ui-900/60">
                <svg className="h-3 w-3 shrink-0 text-ui-500 transition-transform group-open:rotate-90" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" />
                </svg>
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`} />
                <span className="min-w-0 flex-1 truncate">
                    <span className="text-brand-400">$</span>{" "}
                    <span className="font-semibold text-ui-200">{block.name}</span>
                    {args && <span className="text-ui-400"> {args}</span>}
                </span>
                <span className={`shrink-0 ${styles.text}`}>
                    {block.status === "running" ? "running…" : block.status === "success" ? "✓" : "✗"}
                    {duration && <span className="ml-1.5 text-ui-500">{duration}</span>}
                </span>
            </summary>
            <div className="max-h-72 overflow-auto border-t border-ui-700/50 px-3 py-2 leading-relaxed">
                {block.input.trim() && (
                    <>
                        <div className="text-ui-500"># input</div>
                        <pre className="mb-2 whitespace-pre-wrap break-words text-ui-400">{formatToolText(block.input)}</pre>
                    </>
                )}
                <div className="text-ui-500"># output</div>
                {block.output === undefined ? (
                    <div className="text-ui-500">
                        waiting for result<span className="animate-pulse">_</span>
                    </div>
                ) : (
                    <pre className={`whitespace-pre-wrap break-words ${block.status === "error" ? "text-red-400" : "text-ui-300"}`}>
                        {block.output ? formatToolText(block.output) : "(no output)"}
                    </pre>
                )}
            </div>
        </details>
    )
}

export function ChatWindow({ messages, loading, greeting, greetingName, assistantName }: ChatWindowProps) {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // While a reply is in progress, the last message is the (possibly empty) assistant placeholder
    const last = messages[messages.length - 1]
    const replying = loading && last?.role === "assistant"
    // Show the thinking status until text starts streaming, and again while tools run
    const lastBlock = last?.blocks?.[last.blocks.length - 1]
    const waiting = replying && !(lastBlock ? lastBlock.type === "text" && lastBlock.text : last.content)

    if (messages.length === 0) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-6 text-center">
                <LogoMark className="mb-4 h-14 w-[4.4rem] drop-shadow-[0_8px_24px_rgb(255_106_26/0.25)]" />
                <p className="text-5xl font-extrabold tracking-tight text-ui-50">
                    <Greeting text={greeting || "Hello!"} name={greetingName} />
                </p>
                {assistantName ? (
                    <p className="max-w-[90%] truncate text-base text-ui-400">
                        Chatting with <span className="font-semibold text-brand-400">{assistantName}</span>
                    </p>
                ) : (
                    <p className="text-base text-ui-400">
                        Select a model below to start chatting.
                    </p>
                )}
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-2xl px-4 py-6">
                {messages.map((msg, i) =>
                    msg.role === "user" ? (
                        <div key={i} className="mb-6 flex justify-end">
                            <div className="max-w-[75%] whitespace-pre-wrap rounded-xl rounded-br-sm border border-brand-500/30 bg-brand-500/10 px-4 py-2.5 text-sm leading-relaxed text-ui-100">
                                {msg.content}
                            </div>
                        </div>
                    ) : (
                        <div key={i} className="mb-6 flex gap-3">
                            <AssistantAvatar working={replying && i === messages.length - 1} />
                            <div className="min-w-0 max-w-none pt-1">
                                {msg.assistantName && (
                                    <div className="mb-1.5 truncate text-[11px] font-medium text-ui-500">
                                        {msg.assistantName}
                                    </div>
                                )}
                                {msg.blocks?.length ? (
                                    msg.blocks.map((block, j) =>
                                        block.type === "text" ? (
                                            <div key={j} className="prose dark:prose-invert prose-sm leading-relaxed text-ui-300">
                                                <Markdown remarkPlugins={[remarkGfm]}>{block.text}</Markdown>
                                            </div>
                                        ) : (
                                            <ToolCallBlock key={j} block={block} />
                                        ),
                                    )
                                ) : (
                                    <div className="prose dark:prose-invert prose-sm leading-relaxed text-ui-300">
                                        <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                                    </div>
                                )}
                                {waiting && i === messages.length - 1 && <ThinkingIndicator />}
                            </div>
                        </div>
                    ),
                )}
                {loading && !replying && (
                    <div className="mb-6 flex gap-3">
                        <AssistantAvatar working />
                        <div className="pt-1">
                            <ThinkingIndicator />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    )
}
