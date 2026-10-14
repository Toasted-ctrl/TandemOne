import { useEffect, useRef, useState } from "react"
import type { ModelParameters } from "../services/stream-agent"
import type { ModelSamplingSupport } from "../services/get-model-sampling"

type SamplingSelectorProps = {
    parameters: ModelParameters
    onChange: (parameters: ModelParameters) => void
    // Null while unknown (no model selected, loading or failed), in which case every parameter is shown
    supported: ModelSamplingSupport | null
    // Which side of the button the menu opens on
    placement?: "up" | "down"
}

type ParameterSpec = {
    key: keyof ModelParameters
    label: string
    hint: string
    min: number
    max: number
    step: number
    // Slider position shown while the parameter is unset (provider default applies)
    placeholder: number
}

const PARAMETERS: ParameterSpec[] = [
    { key: "temperature", label: "Temperature", hint: "Higher is more random", min: 0, max: 2, step: 0.05, placeholder: 1 },
    { key: "top_p", label: "Top P", hint: "Nucleus sampling cutoff", min: 0, max: 1, step: 0.01, placeholder: 1 },
    { key: "top_k", label: "Top K", hint: "Sample from the K likeliest tokens", min: 1, max: 100, step: 1, placeholder: 40 },
]

export function SamplingSelector({ parameters, onChange, supported, placement = "up" }: SamplingSelectorProps) {
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

    const available = supported ? PARAMETERS.filter((p) => supported[p.key]) : PARAMETERS
    const customised = available.some((p) => parameters[p.key] != null)

    function setParameter(key: keyof ModelParameters, value: number | null) {
        onChange({ ...parameters, [key]: value })
    }

    return (
        <div ref={containerRef} className="relative shrink-0">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                title="Sampling parameters"
                className={`
                    flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition
                    ${customised
                        ? "bg-amber-500/10 text-amber-300 hover:bg-amber-500/15"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                    }
                `}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-400/60">
                    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
                </svg>
                <span className="hidden sm:inline">Sampling</span>
                {customised && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />}
            </button>

            {open && (
                <div className={`absolute right-0 z-50 ${placement === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5"} w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-700/50 bg-zinc-900 py-1.5 shadow-xl shadow-amber-950/20`}>
                    <div className="flex items-center justify-between px-3 py-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                            Sampling
                        </span>
                        {customised && (
                            <button
                                type="button"
                                onClick={() => onChange({ temperature: null, top_p: null, top_k: null })}
                                className="cursor-pointer text-[11px] text-zinc-500 transition hover:text-zinc-300"
                            >
                                Reset all
                            </button>
                        )}
                    </div>

                    {available.map((spec) => (
                        <ParameterSlider
                            key={spec.key}
                            spec={spec}
                            value={parameters[spec.key]}
                            onChange={(value) => setParameter(spec.key, value)}
                        />
                    ))}

                    {available.length === 0 && (
                        <div className="px-3 py-2 text-xs text-zinc-400">
                            This model doesn't support sampling parameters.
                        </div>
                    )}

                    <div className="mt-1 border-t border-zinc-800 px-3 pt-2 pb-1 text-[11px] leading-snug text-zinc-500">
                        {supported
                            ? "Unset parameters use the provider default. Only parameters this model supports are shown."
                            : "Unset parameters use the provider default. Not every model supports every parameter."}
                    </div>
                </div>
            )}
        </div>
    )
}

type ParameterSliderProps = {
    spec: ParameterSpec
    value: number | null | undefined
    onChange: (value: number | null) => void
}

function ParameterSlider({ spec, value, onChange }: ParameterSliderProps) {
    const isSet = value != null

    return (
        <div className="px-3 py-2">
            <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-medium ${isSet ? "text-amber-200" : "text-zinc-300"}`}>
                    {spec.label}
                </span>
                <div className="flex items-center gap-1">
                    <span className={`text-xs tabular-nums ${isSet ? "text-amber-300" : "text-zinc-500 italic"}`}>
                        {isSet ? value : "Default"}
                    </span>
                    {isSet && (
                        <button
                            type="button"
                            onClick={() => onChange(null)}
                            aria-label={`Reset ${spec.label}`}
                            className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200"
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
            <input
                type="range"
                min={spec.min}
                max={spec.max}
                step={spec.step}
                value={value ?? spec.placeholder}
                onChange={(e) => onChange(Number(e.target.value))}
                aria-label={spec.label}
                className={`mt-1.5 w-full cursor-pointer accent-amber-500 ${isSet ? "" : "opacity-40"}`}
            />
            <div className="text-[11px] text-zinc-500">{spec.hint}</div>
        </div>
    )
}
