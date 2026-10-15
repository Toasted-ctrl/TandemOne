import { useEffect, useRef, useState } from "react"
import type { Mcp } from "../services/get-mcps"

type ToolSelectorProps = {
    mcps: Mcp[]
    selectedMcps: string[]
    onMcpToggle: (mcpName: string) => void
    userVsFiles: boolean
    onUserVsFilesToggle: () => void
    userVsMemories: boolean
    onUserVsMemoriesToggle: () => void
    userVsSkills: boolean
    onUserVsSkillsToggle: () => void
    // Which side of the button the menu opens on
    placement?: "up" | "down"
}

export function ToolSelector({
    mcps,
    selectedMcps,
    onMcpToggle,
    userVsFiles,
    onUserVsFilesToggle,
    userVsMemories,
    onUserVsMemoriesToggle,
    userVsSkills,
    onUserVsSkillsToggle,
    placement = "up",
}: ToolSelectorProps) {
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

    const count = selectedMcps.length + (userVsFiles ? 1 : 0) + (userVsMemories ? 1 : 0) + (userVsSkills ? 1 : 0)

    return (
        <div ref={containerRef} className="relative shrink-0">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`
                    flex cursor-pointer items-center gap-1.5 h-9 rounded-lg px-3 text-xs font-semibold whitespace-nowrap transition
                    ${count > 0
                        ? "bg-brand-500/10 text-brand-300 hover:bg-brand-500/15"
                        : "bg-ui-800 text-ui-300 hover:bg-ui-700 hover:text-ui-100"
                    }
                `}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand-500">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
                </svg>
                {count > 0 ? (
                    <span>{count} tool{count !== 1 && "s"}</span>
                ) : (
                    "Tools"
                )}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5 shrink-0 opacity-40">
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {open && (
                <div className={`absolute left-0 z-50 ${placement === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5"} max-h-72 min-w-56 overflow-y-auto rounded-xl border border-ui-700/50 bg-ui-900 py-1.5 shadow-xl shadow-black/10 dark:shadow-black/50`}>
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ui-500">
                        Vector Search
                    </div>
                    <ToolOption
                        label="User Files"
                        selected={userVsFiles}
                        onToggle={onUserVsFilesToggle}
                    />
                    <ToolOption
                        label="User Memories"
                        selected={userVsMemories}
                        onToggle={onUserVsMemoriesToggle}
                    />
                    <ToolOption
                        label="User Skill Discovery"
                        selected={userVsSkills}
                        onToggle={onUserVsSkillsToggle}
                    />

                    {mcps.length > 0 && (
                        <>
                            <div className="my-1.5 border-t border-ui-800" />
                            <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ui-500">
                                MCP Servers
                            </div>
                            {mcps.map((mcp) => (
                                <ToolOption
                                    key={mcp.id}
                                    label={mcp.name}
                                    selected={selectedMcps.includes(mcp.name)}
                                    onToggle={() => onMcpToggle(mcp.name)}
                                />
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

function ToolOption({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
    return (
        <button
            type="button"
            onClick={onToggle}
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
            <span>{label}</span>
        </button>
    )
}
