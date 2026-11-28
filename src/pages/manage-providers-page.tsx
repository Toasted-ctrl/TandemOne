import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/app-header'
import { ProviderForm } from '../components/provider-form'
import { addAdminProvider, type AdminProviderPayload } from '../services/add-admin-provider'
import { deleteAdminProvider } from '../services/delete-admin-provider'
import { getAdminProviders, LANGCHAIN_CONNECTIONS, type AdminProvider } from '../services/get-admin-providers'
import { getUser, isAdmin } from '../services/get-user'

// Matches Tailwind's `sm` breakpoint; the add panel starts expanded on wider screens only
const WIDE_SCREEN_QUERY = '(min-width: 640px)'

function compareProviders(a: AdminProvider, b: AdminProvider): number {
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        || a.base_url.localeCompare(b.base_url)
}

function connectionLabel(provider: AdminProvider): string {
    return LANGCHAIN_CONNECTIONS.find(c => c.value === provider.langchain_con)?.label ?? provider.langchain_con
}

function ProviderIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ui-500">
            <rect x="2" y="3" width="20" height="8" rx="2" />
            <rect x="2" y="13" width="20" height="8" rx="2" />
            <line x1="6" y1="7" x2="6.01" y2="7" />
            <line x1="6" y1="17" x2="6.01" y2="17" />
        </svg>
    )
}

export function ManageProvidersPage() {
    const navigate = useNavigate()
    const [authorized, setAuthorized] = useState(false)
    const [addPanelOpen, setAddPanelOpen] = useState(() => window.matchMedia(WIDE_SCREEN_QUERY).matches)
    const [providers, setProviders] = useState<AdminProvider[]>([])
    const [providersLoading, setProvidersLoading] = useState(true)
    const [loadError, setLoadError] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
    const [deleteError, setDeleteError] = useState<string | null>(null)

    useEffect(() => {
        getUser()
            .then(user => {
                if (!isAdmin(user)) {
                    navigate('/chat', { replace: true })
                    return
                }
                setAuthorized(true)
            })
            .catch(() => navigate('/login', { replace: true }))
    }, [navigate])

    useEffect(() => {
        if (!authorized) return
        getAdminProviders()
            .then(res => setProviders([...res.providers].sort(compareProviders)))
            .catch(() => setLoadError(true))
            .finally(() => setProvidersLoading(false))
    }, [authorized])

    async function handleSave(payload: AdminProviderPayload): Promise<boolean> {
        setSaveError(null)
        try {
            const created = await addAdminProvider(payload)
            setProviders(prev => [...prev, created].sort(compareProviders))
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Save failed')
            return false
        }
        setAddPanelOpen(false)
        return true
    }

    async function handleDelete(provider: AdminProvider) {
        if (!window.confirm(`Delete the provider "${provider.name}"? Its models will no longer be reachable. This can't be undone.`)) return
        setDeleteError(null)
        setDeletingIds(prev => new Set(prev).add(provider.id))
        try {
            await deleteAdminProvider(provider.id)
            setProviders(prev => prev.filter(p => p.id !== provider.id))
        } catch (err) {
            // Leave the item in place so the user can retry
            setDeleteError(err instanceof Error ? err.message : 'Delete failed')
        } finally {
            setDeletingIds(prev => {
                const next = new Set(prev)
                next.delete(provider.id)
                return next
            })
        }
    }

    if (!authorized) return null

    return (
        <div className="flex min-h-svh flex-col bg-ui-950 bg-grid">
            <AppHeader />
            <div className="flex-1 px-4 py-10">
                <div className="mx-auto max-w-xl">
                    <h1 className="text-2xl font-bold tracking-tight text-ui-50">Providers</h1>
                    <p className="mt-2 text-sm text-ui-400">
                        Manage the providers that serve models to users and agents.
                    </p>

                    <div className="mt-8 rounded-xl border border-ui-800 bg-ui-900">
                        <button
                            onClick={() => setAddPanelOpen(open => !open)}
                            aria-expanded={addPanelOpen}
                            aria-controls="add-provider-panel"
                            className="flex w-full cursor-pointer items-center justify-between gap-3 px-6 py-4 text-sm font-medium text-ui-300 transition hover:text-ui-50"
                        >
                            <span className="flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ui-500">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Add a provider
                            </span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-ui-500 transition-transform duration-200 ${addPanelOpen ? 'rotate-180' : ''}`}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                        {/* Hidden rather than unmounted so in-progress input survives collapsing */}
                        <div id="add-provider-panel" className={`border-t border-ui-800/60 px-6 pb-6 pt-4 ${addPanelOpen ? '' : 'hidden'}`}>
                            <ProviderForm onSave={handleSave} />
                            {saveError && <p className="mt-3 text-xs text-red-400">{saveError}</p>}
                        </div>
                    </div>

                    <div className="mt-6 space-y-2">
                        <h2 className="text-sm font-medium text-ui-400">Providers</h2>
                        {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
                        {providersLoading ? (
                            <p className="text-xs text-ui-500">Loading…</p>
                        ) : loadError ? (
                            <p className="text-xs text-red-400">Failed to load providers.</p>
                        ) : providers.length === 0 ? (
                            <p className="text-xs text-ui-500">No providers have been added yet.</p>
                        ) : (
                            providers.map(provider => (
                                <div
                                    key={provider.id}
                                    className="flex items-center gap-3 rounded-lg border border-ui-800 bg-ui-900 px-4 py-3"
                                >
                                    <ProviderIcon />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm text-ui-50">{provider.name}</p>
                                        <p className="truncate font-mono text-xs text-ui-600" title={provider.base_url}>{provider.base_url}</p>
                                        <p className="mt-0.5 truncate text-xs text-ui-500">
                                            {connectionLabel(provider)}
                                            {' · '}{provider.internal ? 'Internal' : 'External'}
                                            {' · '}{provider.requires_api_key ? 'API key required' : 'No API key'}
                                            {provider.mac_address && <>{' · '}<span className="font-mono">{provider.mac_address}</span></>}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(provider)}
                                        disabled={deletingIds.has(provider.id)}
                                        aria-label={`Delete ${provider.name}`}
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
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
