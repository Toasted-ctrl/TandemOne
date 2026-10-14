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
                    flex max-w-44 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition sm:max-w-64
                    ${selectedAgent
                        ? "bg-amber-500/10 text-amber-300 hover:bg-amber-500/15"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                    }
                `}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-400/60">
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
                <div className="absolute bottom-full left-0 z-50 mb-1.5 max-h-72 min-w-56 overflow-y-auto rounded-xl border border-zinc-700/50 bg-zinc-900 py-1.5 shadow-xl shadow-amber-950/20">
                    <div className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
                        Agents
                    </div>
                    {agents === null ? (
                        <div className="px-3 py-1.5 pl-8 text-xs text-zinc-600 italic">Loading agents...</div>
                    ) : agents.length === 0 ? (
                        <div className="px-3 py-1.5 pl-8 text-xs text-zinc-600 italic">No agents available</div>
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
                                            ? "bg-amber-500/10 font-medium text-amber-200"
                                            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                                        }
                                    `}
                                >
                                    {selected && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-400">
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
