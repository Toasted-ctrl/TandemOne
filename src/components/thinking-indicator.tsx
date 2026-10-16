import { useEffect, useState } from "react"

const PHRASES = [
    "Thinking",
    "Concocting",
    "Pondering",
    "Pedalling",
    "Mulling it over",
    "Brewing",
    "Noodling",
    "Cooking something up",
    "Connecting the dots",
    "Finding the rhythm",
    "Riffing",
    "Tinkering",
]

const PHRASE_INTERVAL_MS = 2800

function randomPhrase(exclude?: string) {
    const options = PHRASES.filter((p) => p !== exclude)
    return options[Math.floor(Math.random() * options.length)]
}

// Rotating "Thinking…" status shown while waiting on the AI
export function ThinkingIndicator() {
    const [phrase, setPhrase] = useState(() => randomPhrase())

    useEffect(() => {
        const timer = setInterval(() => setPhrase((prev) => randomPhrase(prev)), PHRASE_INTERVAL_MS)
        return () => clearInterval(timer)
    }, [])

    return (
        <div role="status" className="py-0.5 text-sm font-medium">
            {/* Keyed so each new phrase replays the entrance animation */}
            <span key={phrase} className="inline-block text-shimmer motion-safe:animate-[phrase-in_0.3s_ease-out,shimmer_2s_linear_infinite]">
                {phrase}…
            </span>
        </div>
    )
}
