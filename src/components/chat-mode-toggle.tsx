export type ChatMode = "model" | "agent"

type ChatModeToggleProps = {
    mode: ChatMode
    onChange: (mode: ChatMode) => void
}

const MODES: { value: ChatMode; label: string; icon: React.ReactNode }[] = [
    {
        value: "model",
        label: "Model",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4Z" />
            </svg>
        ),
    },
    {
        value: "agent",
        label: "Agent",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <rect x="3" y="8" width="18" height="12" rx="2" />
                <path d="M12 8V4" />
                <circle cx="12" cy="3" r="1" />
                <path d="M9 13v2M15 13v2" />
            </svg>
        ),
    },
]

export function ChatModeToggle({ mode, onChange }: ChatModeToggleProps) {
    return (
        <div role="radiogroup" aria-label="Chat with" className="flex shrink-0 rounded-lg bg-zinc-800/60 p-0.5">
            {MODES.map((m) => {
                const active = mode === m.value
                return (
                    <button
                        key={m.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onChange(m.value)}
                        title={m.value === "model" ? "Chat with a model" : "Chat with an agent"}
                        className={`
                            flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition
                            ${active ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}
                        `}
                    >
                        {m.icon}
                        <span className="hidden sm:inline">{m.label}</span>
                    </button>
                )
            })}
        </div>
    )
}
