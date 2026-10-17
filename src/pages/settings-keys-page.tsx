import { useEffect, useState } from "react"
import { AppHeader } from "../components/app-header"
import { BackToSettingsLink } from "../components/back-to-settings-link"
import { getProviderConfiguration, type ProviderConfiguration } from "../services/get-provider-configuration"
import { deleteUserKey } from "../services/delete-user-key"
import { saveUserKey } from "../services/save-user-key"

export function SettingsKeysPage() {
    const [providers, setProviders] = useState<ProviderConfiguration[]>([])
    const [loading, setLoading] = useState(true)
    const [keyInputs, setKeyInputs] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        loadProviders()
    }, [])

    function loadProviders() {
        setLoading(true)
        getProviderConfiguration()
            .then((res) => setProviders(res.providers))
            .catch(() => setError("Failed to load provider configuration"))
            .finally(() => setLoading(false))
    }

    async function handleSave(providerName: string) {
        const key = keyInputs[providerName]?.trim()
        if (!key) return

        setSaving(providerName)
        setError(null)
        setSuccess(null)

        try {
            await saveUserKey(providerName, key)
            setKeyInputs((prev) => ({ ...prev, [providerName]: "" }))
            setSuccess(`API key saved for ${providerName}`)
            loadProviders()
        } catch {
            setError(`Failed to save API key for ${providerName}`)
        } finally {
            setSaving(null)
        }
    }

    async function handleDelete(providerName: string, keyId: string) {
        setDeleting(keyId)
        setError(null)
        setSuccess(null)

        try {
            await deleteUserKey(keyId)
            setSuccess(`API key deleted for ${providerName}`)
            loadProviders()
        } catch {
            setError(`Failed to delete API key for ${providerName}`)
        } finally {
            setDeleting(null)
        }
    }

    const providersRequiringKeys = providers.filter((p) => p.requires_api_key)

    return (
        <div className="flex min-h-svh flex-col bg-ui-950 bg-grid">
            <AppHeader />
            <div className="flex-1 px-4 py-10">
            <div className="mx-auto max-w-xl">
                <BackToSettingsLink />
                <h1 className="text-2xl font-bold tracking-tight text-ui-50">
                    API Keys
                </h1>
                <p className="mt-2 text-sm text-ui-400">
                    Configure API keys for your providers.
                </p>

                {error && (
                    <div className="mt-4 rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-4 rounded-lg border border-green-800 bg-green-950 px-4 py-3 text-sm text-green-300">
                        {success}
                    </div>
                )}

                {loading ? (
                    <div className="mt-8 text-sm text-ui-500">Loading providers...</div>
                ) : providersRequiringKeys.length === 0 ? (
                    <div className="mt-8 text-sm text-ui-500">
                        No providers require API key configuration.
                    </div>
                ) : (
                    <div className="mt-8 space-y-4">
                        {providersRequiringKeys.map((provider) => (
                            <div
                                key={provider.id}
                                className="rounded-xl border border-ui-800 bg-ui-900 p-5"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-ui-50">
                                        {provider.name}
                                    </span>
                                    {provider.api_key_configured ? (
                                        <div className="flex items-center gap-2">
                                            <code className="rounded-full bg-green-900/50 px-2.5 py-0.5 font-mono text-xs font-medium text-green-400">
                                                {provider.api_key_short ? `${provider.api_key_short}…` : "Configured"}
                                            </code>
                                            {provider.api_key_id && (
                                                <button
                                                    onClick={() => handleDelete(provider.name, provider.api_key_id!)}
                                                    disabled={deleting === provider.api_key_id}
                                                    aria-label={`Delete API key for ${provider.name}`}
                                                    className="shrink-0 cursor-pointer rounded-md p-1.5 text-ui-500 transition hover:bg-ui-800 hover:text-red-400 disabled:pointer-events-none disabled:opacity-50"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                        <path d="M10 11v6" />
                                                        <path d="M14 11v6" />
                                                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="rounded-full bg-ui-800 px-2.5 py-0.5 text-xs font-medium text-ui-400">
                                            Not configured
                                        </span>
                                    )}
                                </div>

                                {!provider.api_key_configured && (
                                    <div className="mt-3 flex items-end gap-2">
                                        <input
                                            type="password"
                                            value={keyInputs[provider.name] ?? ""}
                                            onChange={(e) =>
                                                setKeyInputs((prev) => ({
                                                    ...prev,
                                                    [provider.name]: e.target.value,
                                                }))
                                            }
                                            placeholder="Enter API key..."
                                            className="flex-1 rounded-lg border border-ui-700 bg-ui-800 px-3 py-2 text-sm text-ui-100 placeholder-ui-500 outline-none transition focus:border-ui-600 focus:ring-1 focus:ring-ui-600"
                                        />
                                        <button
                                            onClick={() => handleSave(provider.name)}
                                            disabled={!keyInputs[provider.name]?.trim() || saving === provider.name}
                                            className="shrink-0 cursor-pointer rounded-lg bg-ui-50 px-4 py-2 text-sm font-medium text-ui-900 transition-all hover:bg-ui-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                            {saving === provider.name ? "Saving..." : "Save"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            </div>
        </div>
    )
}
