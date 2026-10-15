import { useEffect, useRef, useState } from "react"
import type { Mcp } from "../services/get-mcps"

type McpSelectorProps = {
    mcps: Mcp[]
    selectedMcps: string[]
    onToggle: (mcpName: string) => void
}

export function McpSelector({ mcps, selectedMcps, onToggle }: McpSelectorProps) {
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

    const count = selectedMcps.length

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`
                    flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition
                    ${count > 0
                        ? "bg-brand-500/10 text-brand-300 hover:bg-brand-500/15"
                        : "text-ui-400 hover:bg-ui-800 hover:text-ui-300"
                    }
                `}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand-400/60">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
                </svg>
                {count > 0 ? (
                    <span>{count} MCP{count !== 1 && "s"}</span>
                ) : (
                    "Tools"
                )}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5 shrink-0 opacity-40">
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {open && (
                <div className="absolute bottom-full left-0 z-50 mb-1.5 max-h-72 min-w-48 overflow-y-auto rounded-xl border border-ui-700/50 bg-ui-900 py-1.5 shadow-xl shadow-black/10 dark:shadow-black/50">
                    {mcps.length === 0 ? (
                        <div className="px-3 py-1.5 text-xs text-ui-600 italic">
                            No MCPs available
                        </div>
                    ) : (
                        mcps.map((mcp) => {
                            const selected = selectedMcps.includes(mcp.name)
                            return (
                                <button
                                    key={mcp.id}
                                    type="button"
                                    onClick={() => onToggle(mcp.name)}
                                    className={`
                                        flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs transition
                                        ${selected
                                            ? "bg-brand-500/10 font-medium text-brand-200"
                                            : "text-ui-400 hover:bg-ui-800 hover:text-ui-200"
                                        }
                                    `}
                                >
                                    {selected ? (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand-400">
                                            <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                    ) : (
                                        <span className="inline-block h-3 w-3 shrink-0 rounded border border-ui-600" />
                                    )}
                                    <span>{mcp.name}</span>
                                </button>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}
