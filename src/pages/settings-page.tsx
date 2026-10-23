import { useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AppHeader } from "../components/app-header"
import { getUser } from "../services/get-user"
import { useTheme, type ThemePreference } from "../theme"

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "funky", label: "Funky" },
    { value: "terminal", label: "Terminal" },
    { value: "system", label: "System" },
]

export function SettingsPage() {
    const navigate = useNavigate()
    const { preference, setTheme } = useTheme()

    useEffect(() => {
        getUser().catch(() => navigate("/login", { replace: true }))
    }, [navigate])

    return (
        <div className="flex min-h-svh flex-col bg-ui-950 bg-grid">
            <AppHeader />
            <div className="flex-1 px-4 py-10">
            <div className="mx-auto max-w-xl">
                <h1 className="text-2xl font-bold tracking-tight text-ui-50">
                    Settings
                </h1>
                <p className="mt-2 text-sm text-ui-400">
                    Manage your account and configuration.
                </p>

                <div className="mt-8 space-y-3">
                    <Link
                        to="/settings/personal"
                        className="flex items-center justify-between rounded-xl border border-ui-800 bg-ui-900 p-5 transition hover:border-ui-700 hover:bg-ui-800/60"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-ui-50">Personal</span>
                                <p className="text-xs text-ui-500">View your account details</p>
                            </div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ui-600">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </Link>

                    <Link
                        to="/settings/keys"
                        className="flex items-center justify-between rounded-xl border border-ui-800 bg-ui-900 p-5 transition hover:border-ui-700 hover:bg-ui-800/60"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-ui-50">API Keys</span>
                                <p className="text-xs text-ui-500">Configure API keys for your providers</p>
                            </div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ui-600">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </Link>

                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ui-800 bg-ui-900 p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-500">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 3v18" />
                                    <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-ui-50">Appearance</span>
                                <p className="text-xs text-ui-500">Light, dark, funky, terminal, or follow your device</p>
                            </div>
                        </div>
                        <div role="radiogroup" aria-label="Theme" className="flex gap-1">
                            {THEME_OPTIONS.map((option) => {
                                const active = preference === option.value
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={active}
                                        onClick={() => setTheme(option.value)}
                                        className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                            active
                                                ? "bg-flame text-ui-950"
                                                : "bg-ui-800 text-ui-400 hover:bg-ui-700 hover:text-ui-200"
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    )
}
