import { useEffect, useRef, useState } from "react"
import type { AgentSummary } from "../services/get-agents"

type ChatAgentSelectorProps = {
    // Null while the list is loading
    agents: AgentSummary[] | null
    selectedAgentId: string | null
    onSelect: (agentId: string) => void
}

export function ChatAgentSelector({ agents, selectedAgentId, onSelect }: ChatAgentSelectorProps) {
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        if (open) {
            document.addEventListener("mousedown", handleClick)
            return () => document.removeEventListener("mousedown", handleClick)
        }
    }, [open])

    const selectedAgent = agents?.find((a) => a.id === selectedAgentId)

    return (
        <div ref={containerRef} className="relative min-w-0">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                title={selectedAgent?.name}
                className={`
                    flex max-w-44 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition sm:max-w-64
                    ${selectedAgent
                        ? "bg-brand-500/10 text-brand-300 hover:bg-brand-500/15"
                        : "text-ui-300 hover:bg-ui-700 hover:text-ui-100"
                    }
                `}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand-500">
                    <rect x="3" y="8" width="18" height="12" rx="2" />
                    <path d="M12 8V4" />
                    <circle cx="12" cy="3" r="1" />
                    <path d="M9 13v2M15 13v2" />
                </svg>
                <span className="min-w-0 truncate">{selectedAgent?.name ?? "Select an agent"}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5 shrink-0 opacity-40">
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {open && (
                <div className="absolute bottom-full left-0 z-50 mb-1.5 max-h-72 min-w-56 overflow-y-auto rounded-xl border border-ui-700/50 bg-ui-900 py-1.5 shadow-xl shadow-black/10 dark:shadow-black/50">
                    <div className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wide text-ui-500 uppercase">
                        Agents
                    </div>
                    {agents === null ? (
                        <div className="px-3 py-1.5 pl-8 text-xs text-ui-600 italic">Loading agents...</div>
                    ) : agents.length === 0 ? (
                        <div className="px-3 py-1.5 pl-8 text-xs text-ui-600 italic">No agents available</div>
                    ) : (
                        agents.map((agent) => {
                            const selected = agent.id === selectedAgentId
                            return (
                                <button
                                    key={agent.id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(agent.id)
                                        setOpen(false)
                                    }}
                                    className={`
                                        flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs transition
                                        ${selected
                                            ? "bg-brand-500/10 font-medium text-brand-200"
                                            : "text-ui-400 hover:bg-ui-800 hover:text-ui-200"
                                        }
                                    `}
                                >
                                    {selected && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand-400">
                                            <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                    )}
                                    <span className={selected ? "" : "pl-5"}>{agent.name}</span>
                                </button>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}
