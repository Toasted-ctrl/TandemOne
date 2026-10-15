import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { GoogleLoginButton } from "../components/google-login-button"
import { loginWithGoogle } from "../features/auth/login"
import { LogoMark, Wordmark } from "../components/logo"

type Feature = {
    title: string
    description: string
    icon: ReactNode
}

const iconProps = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
}

const features: Feature[] = [
    {
        title: "Any model, one place",
        description: "Chat with models from multiple providers using your own API keys.",
        icon: (
            <svg {...iconProps}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        ),
    },
    {
        title: "Your own agents",
        description: "Give an agent a prompt, a model and tools, then chat with it anytime.",
        icon: (
            <svg {...iconProps}>
                <rect x="4" y="8" width="16" height="12" rx="2" />
                <path d="M12 8V4" />
                <circle cx="12" cy="3" r="1" />
                <path d="M9 13v2" />
                <path d="M15 13v2" />
            </svg>
        ),
    },
    {
        title: "Tools and web search",
        description: "Connect MCP servers and turn on web search when you need it.",
        icon: (
            <svg {...iconProps}>
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
        ),
    },
    {
        title: "Your documents and skills",
        description: "Upload files, save memories and write skills your models can search.",
        icon: (
            <svg {...iconProps}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M8 13h8" />
                <path d="M8 17h5" />
            </svg>
        ),
    },
]

const MOBILE_FEATURE_COUNT = 2

const linkClass = "text-ui-400 underline underline-offset-2 hover:text-ui-50 transition-colors"

export function LoginPage() {
    return (
        <main className="flex min-h-svh items-center justify-center bg-ui-950 bg-grid px-4 py-8 sm:py-12">
            <div className="grid w-full max-w-5xl gap-8 sm:gap-10 lg:grid-cols-[1fr_24rem] lg:gap-x-16 lg:gap-y-10">
                <section className="text-center lg:self-end lg:text-left">
                    <LogoMark className="mx-auto mb-5 h-14 w-[4.4rem] lg:mx-0" />
                    <h1 className="text-4xl">
                        <Wordmark />
                    </h1>
                    <p className="mt-4 text-lg text-ui-300">
                        Chat with any model, or build your own agents.
                    </p>
                </section>

                <div className="mx-auto w-full max-w-sm lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
                    <div className="rounded-2xl border border-ui-800 bg-ui-900 p-8 shadow-2xl shadow-black/5 dark:shadow-black/40">
                        <GoogleLoginButton onLogin={loginWithGoogle} />

                        <p className="mt-6 text-center text-xs text-ui-500">
                            By continuing, you agree to our{" "}
                            <Link to="/terms" className={linkClass}>
                                Terms of Service
                            </Link>
                            {" "}and acknowledge our{" "}
                            <Link to="/privacy" className={linkClass}>
                                Privacy Policy
                            </Link>
                        </p>
                    </div>
                </div>

                <ul className="mx-auto grid w-full max-w-sm gap-6 sm:max-w-none sm:grid-cols-2 lg:mx-0 lg:self-start">
                    {features.map((feature, index) => (
                        // Phones only show the first few features to keep the page on one screen
                        <li key={feature.title} className={`gap-3 ${index < MOBILE_FEATURE_COUNT ? "flex" : "hidden sm:flex"}`}>
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
                                {feature.icon}
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-ui-50">
                                    {feature.title}
                                </h2>
                                <p className="mt-1 text-sm leading-relaxed text-ui-400">
                                    {feature.description}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </main>
    )
}
