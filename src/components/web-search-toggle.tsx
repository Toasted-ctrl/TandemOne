type WebSearchToggleProps = {
    enabled: boolean
    onToggle: () => void
}

export function WebSearchToggle({ enabled, onToggle }: WebSearchToggleProps) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-pressed={enabled}
            title={enabled ? "Web search enabled: the agent can access the internet" : "Enable web search"}
            className={`
                flex shrink-0 cursor-pointer items-center gap-1.5 h-9 rounded-lg px-3 text-xs font-semibold whitespace-nowrap transition
                ${enabled
                    ? "bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/30 hover:bg-sky-500/15"
                    : "bg-ui-800 text-ui-300 hover:bg-ui-700 hover:text-ui-100"
                }
            `}
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${enabled ? "text-sky-400" : "text-sky-400"}`}>
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="hidden sm:inline">Web</span>
            {enabled && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />}
        </button>
    )
}
