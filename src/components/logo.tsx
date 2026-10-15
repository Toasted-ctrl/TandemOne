type LogoMarkProps = {
    className?: string
}

// Tandem mark: two leaning blocks (you and the AI) moving in step, one slightly ahead
export function LogoMark({ className }: LogoMarkProps) {
    return (
        <svg viewBox="0 0 120 96" className={className} aria-hidden="true">
            <polygon points="34,4 66,4 50,76 18,76" fill="#ff4f1f" />
            <polygon points="70,20 102,20 86,92 54,92" fill="#ffa41f" />
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
