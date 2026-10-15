import { useEffect, useRef } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { LogoMark } from "./logo"

export type ToolBlock = {
    type: "tool_use" | "tool_result"
    name: string
    content: string
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

function AssistantAvatar() {
    return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ui-700/60 bg-ui-900">
            <LogoMark className="h-4 w-5" />
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

function ToolCallBlock({ block }: { block: ToolBlock }) {
    const label = block.type === "tool_use"
        ? `Called: ${block.name}`
        : `Result: ${block.name}`

    return (
        <details className="my-2 rounded-lg border border-ui-700/60 bg-ui-900">
            <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-medium text-ui-400 select-none hover:text-ui-300">
                <svg className="h-3.5 w-3.5 shrink-0 transition-transform [[open]>&]:rotate-90" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" />
                </svg>
                <span className="truncate">{label}</span>
            </summary>
            <pre className="max-h-64 overflow-auto border-t border-ui-700/50 px-3 py-2 text-xs leading-relaxed text-ui-400">
                {block.content}
            </pre>
        </details>
    )
}

export function ChatWindow({ messages, loading, greeting, greetingName, assistantName }: ChatWindowProps) {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

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
                            <AssistantAvatar />
                            <div className="min-w-0 max-w-none pt-1">
                                {msg.assistantName && (
                                    <div className="mb-1 truncate text-[11px] font-medium text-ui-500">
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
                            </div>
                        </div>
                    ),
                )}
                {loading && (
                    <div className="mb-6 flex gap-3">
                        <AssistantAvatar />
                        <div className="flex items-center gap-1 pt-1.5">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400 [animation-delay:150ms]" />
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400 [animation-delay:300ms]" />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    )
}
