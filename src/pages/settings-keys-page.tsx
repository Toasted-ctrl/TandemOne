import { useEffect, useState } from "react"
import { AppHeader } from "../components/app-header"
import { getProviderConfiguration, type ProviderConfiguration } from "../services/get-provider-configuration"
import { saveUserKey } from "../services/save-user-key"

export function SettingsKeysPage() {
    const [providers, setProviders] = useState<ProviderConfiguration[]>([])
    const [loading, setLoading] = useState(true)
    const [keyInputs, setKeyInputs] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState<string | null>(null)
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

    const providersRequiringKeys = providers.filter((p) => p.requires_api_key)

    return (
        <div className="flex min-h-svh flex-col bg-ui-950 bg-grid">
            <AppHeader />
            <div className="flex-1 px-4 py-10">
            <div className="mx-auto max-w-xl">
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
                                key={provider.name}
                                className="rounded-xl border border-ui-800 bg-ui-900 p-5"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-ui-50">
                                        {provider.name}
                                    </span>
                                    {provider.api_key_configured ? (
                                        <span className="rounded-full bg-green-900/50 px-2.5 py-0.5 text-xs font-medium text-green-400">
                                            Configured
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-ui-800 px-2.5 py-0.5 text-xs font-medium text-ui-400">
                                            Not configured
                                        </span>
                                    )}
                                </div>

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
                                        placeholder={provider.api_key_configured ? "Replace existing key..." : "Enter API key..."}
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
                            </div>
                        ))}
                    </div>
                )}
            </div>
            </div>
        </div>
    )
}
