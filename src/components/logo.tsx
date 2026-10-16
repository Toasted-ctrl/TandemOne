type LogoMarkProps = {
    className?: string
    // Blocks take turns stepping forward, used while the AI is working
    animated?: boolean
}

// Tandem mark: two leaning blocks (you and the AI) moving in step, one slightly ahead
export function LogoMark({ className, animated }: LogoMarkProps) {
    const step = animated ? "motion-safe:animate-tandem-step [transform-box:fill-box]" : undefined
    return (
        <svg viewBox="0 0 120 96" className={`overflow-visible ${className ?? ""}`} aria-hidden="true">
            <polygon points="34,4 66,4 50,76 18,76" fill="var(--color-flame-from)" className={step} />
            <polygon
                points="70,20 102,20 86,92 54,92"
                fill="var(--color-flame-to)"
                className={animated ? `${step} [animation-delay:-0.5s]` : undefined}
            />
        </svg>
    )
}

type WordmarkProps = {
    className?: string
}

export function Wordmark({ className = "" }: WordmarkProps) {
    return (
        <span className={`font-extrabold tracking-tight whitespace-nowrap ${className}`}>
            <span className="text-ui-50">Tandem</span>{" "}
            <span className="text-brand-500">One</span>
        </span>
    )
}
