import { useEffect, useRef, useState } from "react"
import type { ProvidersOffering } from "../services/get-models"
import type { ProviderConfiguration } from "../services/get-provider-configuration"

type ChatModelSelectorProps = {
    offerings: ProvidersOffering
    providerConfigs: ProviderConfiguration[]
    selectedProvider: string
    selectedModel: string
    onSelect: (provider: string, model: string) => void
    // Which side of the button the menu opens on
    placement?: "up" | "down"
}

export function ChatModelSelector({
    offerings,
    providerConfigs,
    selectedProvider,
    selectedModel,
    onSelect,
    placement = "up",
}: ChatModelSelectorProps) {
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

    const allProviderNames = [
        ...new Set([
            ...providerConfigs.map((p) => p.name),
            ...Object.keys(offerings.providers),
        ]),
    ]
    const hasSelection = selectedProvider && selectedModel

    return (
        <div ref={containerRef} className="relative min-w-0">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                title={hasSelection ? `${selectedProvider} / ${selectedModel}` : undefined}
                className={`
                    flex max-w-44 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition sm:max-w-64
                    ${hasSelection
                        ? "bg-amber-500/10 text-amber-300 hover:bg-amber-500/15"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                    }
                `}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-400/60">
                    <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4Z" />
                </svg>
                {hasSelection ? (
                    <span className="min-w-0 truncate">{selectedModel}</span>
                ) : (
                    <span className="min-w-0 truncate">Select a model</span>
                )}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5 shrink-0 opacity-40">
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {open && (
                <div className={`absolute left-0 z-50 ${placement === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5"} max-h-72 min-w-56 overflow-y-auto rounded-xl border border-zinc-700/50 bg-zinc-900 py-1.5 shadow-xl shadow-amber-950/20`}>
                    {allProviderNames.map((providerName) => {
                        const models = offerings.providers[providerName]?.chat_completion ?? []
                        const config = providerConfigs.find((p) => p.name === providerName)
                        const needsKey = config?.requires_api_key && !config.api_key_configured

                        return (
                            <div key={providerName}>
                                <div className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
                                    {providerName}
                                </div>
                                {needsKey ? (
                                    <div className="px-3 py-1.5 pl-8 text-xs text-zinc-600 italic">
                                        API key required
                                    </div>
                                ) : models.length === 0 ? (
                                    <div className="px-3 py-1.5 pl-8 text-xs text-zinc-600 italic">
                                        No models available
                                    </div>
                                ) : (
                                    models.map((m) => {
                                        const selected = providerName === selectedProvider && m === selectedModel
                                        return (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => {
                                                    onSelect(providerName, m)
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
                                                <span className={selected ? "" : "pl-5"}>{m}</span>
                                            </button>
                                        )
                                    })
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
