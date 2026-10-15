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
                    flex cursor-pointer items-center gap-1.5 h-9 rounded-lg px-3 text-xs font-semibold whitespace-nowrap transition
                    ${customised
                        ? "bg-brand-500/10 text-brand-300 hover:bg-brand-500/15"
                        : "bg-ui-800 text-ui-300 hover:bg-ui-700 hover:text-ui-100"
                    }
                `}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand-500">
                    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
                </svg>
                <span className="hidden sm:inline">Sampling</span>
                {customised && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />}
            </button>

            {open && (
                <div className={`absolute right-0 z-50 ${placement === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5"} w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-ui-700/50 bg-ui-900 py-1.5 shadow-xl shadow-black/10 dark:shadow-black/50`}>
                    <div className="flex items-center justify-between px-3 py-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-ui-500">
                            Sampling
                        </span>
                        {customised && (
                            <button
                                type="button"
                                onClick={() => onChange({ temperature: null, top_p: null, top_k: null })}
                                className="cursor-pointer text-[11px] text-ui-500 transition hover:text-ui-300"
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
                        <div className="px-3 py-2 text-xs text-ui-400">
                            This model doesn't support sampling parameters.
                        </div>
                    )}

                    <div className="mt-1 border-t border-ui-800 px-3 pt-2 pb-1 text-[11px] leading-snug text-ui-500">
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
                <span className={`text-xs font-medium ${isSet ? "text-brand-200" : "text-ui-300"}`}>
                    {spec.label}
                </span>
                <div className="flex items-center gap-1">
                    <span className={`text-xs tabular-nums ${isSet ? "text-brand-300" : "text-ui-500 italic"}`}>
                        {isSet ? value : "Default"}
                    </span>
                    {isSet && (
                        <button
                            type="button"
                            onClick={() => onChange(null)}
                            aria-label={`Reset ${spec.label}`}
                            className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-ui-500 transition hover:bg-ui-50/10 hover:text-ui-200"
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
                className={`mt-1.5 w-full cursor-pointer accent-brand-500 ${isSet ? "" : "opacity-40"}`}
            />
            <div className="text-[11px] text-ui-500">{spec.hint}</div>
        </div>
    )
}
