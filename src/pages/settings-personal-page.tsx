import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "../components/app-header"
import { BackToSettingsLink } from "../components/back-to-settings-link"
import { getUser, type User } from "../services/get-user"

export function SettingsPersonalPage() {
    const navigate = useNavigate()
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        getUser()
            .then(setUser)
            .catch(() => navigate("/login", { replace: true }))
    }, [navigate])

    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!copied) return
        const timer = setTimeout(() => setCopied(false), 2000)
        return () => clearTimeout(timer)
    }, [copied])

    async function handleCopyId() {
        if (!user) return
        try {
            await navigator.clipboard.writeText(user.user_id)
            setCopied(true)
        } catch {
            // Clipboard is unavailable (e.g. not a secure context); nothing useful to show
        }
    }

    const nameFields = user
        ? [
            { label: "First name", value: user.first_name },
            { label: "Last name", value: user.last_name },
        ]
        : []

    return (
        <div className="flex min-h-svh flex-col bg-ui-950 bg-grid">
            <AppHeader />
            <div className="flex-1 px-4 py-10">
            <div className="mx-auto max-w-xl">
                <BackToSettingsLink />
                <h1 className="text-2xl font-bold tracking-tight text-ui-50">
                    Personal
                </h1>
                <p className="mt-2 text-sm text-ui-400">
                    Your account details.
                </p>

                {!user ? (
                    <div className="mt-8 text-sm text-ui-500">Loading account...</div>
                ) : (
                    <>
                        <div className="mt-8 divide-y divide-ui-800 rounded-xl border border-ui-800 bg-ui-900">
                            {nameFields.map((field) => (
                                <div key={field.label} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                                    <span className="text-sm text-ui-400">{field.label}</span>
                                    <span className="break-all text-sm font-medium text-ui-50">{field.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* The ID is long, so it gets its own card with the value below the label */}
                        <div className="mt-6 rounded-xl border border-ui-800 bg-ui-900 px-5 py-4">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm text-ui-400">User ID</span>
                                <button
                                    type="button"
                                    onClick={handleCopyId}
                                    aria-label={copied ? "Copied" : "Copy user ID"}
                                    className="flex cursor-pointer items-center gap-1 rounded-md border border-ui-700/60 px-2 py-1 text-[11px] font-medium text-ui-400 transition hover:text-ui-100"
                                >
                                    {copied ? (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                    ) : (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" />
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>
                                    )}
                                    {copied ? "Copied" : "Copy"}
                                </button>
                            </div>
                            <div className="mt-1 break-all font-mono text-sm font-medium text-ui-50">{user.user_id}</div>
                        </div>
                    </>
                )}
            </div>
            </div>
        </div>
    )
}
