import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '../components/app-header'
import { McpForm } from '../components/mcp-form'
import { createAdminMcp, type McpPayload } from '../services/create-admin-mcp'
import { deleteAdminMcp } from '../services/delete-admin-mcp'
import { getMcps, type Mcp } from '../services/get-mcps'
import { getUser, isAdmin } from '../services/get-user'

// Matches Tailwind's `sm` breakpoint; the add panel starts expanded on wider screens only
const WIDE_SCREEN_QUERY = '(min-width: 640px)'

function McpIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ui-500">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
    )
}

export function ManageToolsPage() {
    const navigate = useNavigate()
    const [authorized, setAuthorized] = useState(false)
    const [addPanelOpen, setAddPanelOpen] = useState(() => window.matchMedia(WIDE_SCREEN_QUERY).matches)
    const [mcps, setMcps] = useState<Mcp[]>([])
    const [mcpsLoading, setMcpsLoading] = useState(true)
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
        getMcps()
            .then(res => setMcps(res.mcps))
            .catch(() => setMcps([]))
            .finally(() => setMcpsLoading(false))
    }, [authorized])

    async function handleSave(payload: McpPayload): Promise<boolean> {
        setSaveError(null)
        try {
            await createAdminMcp(payload)
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Save failed')
            return false
        }
        // Reload so the list shows the server-assigned id
        getMcps().then(res => setMcps(res.mcps)).catch(console.error)
        setAddPanelOpen(false)
        return true
    }

    async function handleDelete(mcp: Mcp) {
        if (!window.confirm(`Delete the MCP server "${mcp.name}"? Agents using it will lose access to its tools. This can't be undone.`)) return
        setDeleteError(null)
        setDeletingIds(prev => new Set(prev).add(mcp.id))
        try {
            await deleteAdminMcp(mcp.id)
            setMcps(prev => prev.filter(m => m.id !== mcp.id))
        } catch (err) {
            // Leave the item in place so the user can retry
            setDeleteError(err instanceof Error ? err.message : 'Delete failed')
        } finally {
            setDeletingIds(prev => {
                const next = new Set(prev)
                next.delete(mcp.id)
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
                    <h1 className="text-2xl font-bold tracking-tight text-ui-50">Tools</h1>
                    <p className="mt-2 text-sm text-ui-400">
                        Manage the MCP servers that agents can use as tools.
                    </p>

                    <div className="mt-8 rounded-xl border border-ui-800 bg-ui-900">
                        <button
                            onClick={() => setAddPanelOpen(open => !open)}
                            aria-expanded={addPanelOpen}
                            aria-controls="add-mcp-panel"
                            className="flex w-full cursor-pointer items-center justify-between gap-3 px-6 py-4 text-sm font-medium text-ui-300 transition hover:text-ui-50"
                        >
                            <span className="flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ui-500">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Add an MCP server
                            </span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-ui-500 transition-transform duration-200 ${addPanelOpen ? 'rotate-180' : ''}`}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                        {/* Hidden rather than unmounted so in-progress input survives collapsing */}
                        <div id="add-mcp-panel" className={`border-t border-ui-800/60 px-6 pb-6 pt-4 ${addPanelOpen ? '' : 'hidden'}`}>
                            <McpForm onSave={handleSave} />
                            {saveError && <p className="mt-3 text-xs text-red-400">{saveError}</p>}
                        </div>
                    </div>

                    <div className="mt-6 space-y-2">
                        <h2 className="text-sm font-medium text-ui-400">MCP servers</h2>
                        {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
                        {mcpsLoading ? (
                            <p className="text-xs text-ui-500">Loading…</p>
                        ) : mcps.length === 0 ? (
                            <p className="text-xs text-ui-500">No MCP servers have been added yet.</p>
                        ) : (
                            mcps.map(mcp => (
                                <div
                                    key={mcp.id}
                                    className="flex items-center gap-3 rounded-lg border border-ui-800 bg-ui-900 px-4 py-3"
                                >
                                    <McpIcon />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm text-ui-50">{mcp.name}</p>
                                        <p className="truncate text-xs text-ui-600" title={mcp.id}>{mcp.id.length > 18 ? `${mcp.id.slice(0, 18)}...` : mcp.id}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(mcp)}
                                        disabled={deletingIds.has(mcp.id)}
                                        aria-label={`Delete ${mcp.name}`}
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
