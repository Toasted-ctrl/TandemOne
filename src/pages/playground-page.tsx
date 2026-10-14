import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AgentDetailsDialog } from '../components/agent-details-dialog'
import { AgentForm } from '../components/agent-form'
import { AppHeader } from '../components/app-header'
import { createPlaygroundAgent } from '../services/create-playground-agent'
import { deletePlaygroundAgent } from '../services/delete-playground-agent'
import { getAgents, type AgentSummary } from '../services/get-agents'
import { getMcps, type Mcp } from '../services/get-mcps'
import { getProviderModels, type ProvidersOffering } from '../services/get-models'
import type { AgentPayload } from '../services/get-playground-agent'
import { getProviderConfiguration, type ProviderConfiguration } from '../services/get-provider-configuration'
import { getUser } from '../services/get-user'

// Matches Tailwind's `sm` breakpoint; the add panel starts expanded on wider screens only
const WIDE_SCREEN_QUERY = '(min-width: 640px)'

function AgentIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-500">
            <rect x="3" y="8" width="18" height="12" rx="2" />
            <path d="M12 8V4" />
            <circle cx="12" cy="3" r="1" />
            <path d="M9 13v2M15 13v2" />
        </svg>
    )
}

export function PlaygroundPage() {
    const navigate = useNavigate()
    const [addPanelOpen, setAddPanelOpen] = useState(() => window.matchMedia(WIDE_SCREEN_QUERY).matches)

    const [offerings, setOfferings] = useState<ProvidersOffering | null>(null)
    const [providerConfigs, setProviderConfigs] = useState<ProviderConfiguration[]>([])
    const [mcps, setMcps] = useState<Mcp[]>([])

    const [agents, setAgents] = useState<AgentSummary[]>([])
    const [agentsLoading, setAgentsLoading] = useState(true)
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
    const [saveError, setSaveError] = useState<string | null>(null)
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
    const closeAgentDetails = useCallback(() => setSelectedAgentId(null), [])

    useEffect(() => {
        getUser().catch(() => navigate('/login', { replace: true }))
    }, [navigate])

    useEffect(() => {
        getProviderModels().then(setOfferings).catch(console.error)
        getProviderConfiguration().then(res => setProviderConfigs(res.providers)).catch(console.error)
        getMcps().then(res => setMcps(res.mcps)).catch(console.error)
        // The playground only manages agents the user owns
        getAgents('User Owned')
            .then(res => setAgents(res.agents))
            .catch(() => setAgents([]))
            .finally(() => setAgentsLoading(false))
    }, [])

    async function handleSave(payload: AgentPayload): Promise<boolean> {
        setSaveError(null)
        try {
            const agent = await createPlaygroundAgent(payload)
            setAgents(prev => [...prev, { id: agent.id, name: agent.name }])
            setAddPanelOpen(false)
            return true
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Save failed')
            return false
        }
    }

    async function handleDelete(agentId: string) {
        setDeletingIds(prev => new Set(prev).add(agentId))
        try {
            await deletePlaygroundAgent(agentId)
            setAgents(prev => prev.filter(a => a.id !== agentId))
        } catch {
            // leave the item in place so the user can retry
        } finally {
            setDeletingIds(prev => {
                const next = new Set(prev)
                next.delete(agentId)
                return next
            })
        }
    }

    return (
        <div className="flex min-h-svh flex-col bg-zinc-950 bg-[image:linear-gradient(rgba(255,255,255,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.015)_1px,transparent_1px)] bg-[size:48px_48px] bg-[position:center]">
            <AppHeader />
            <div className="flex-1 px-4 py-10">
                <div className="mx-auto max-w-xl">
                    <h1 className="text-2xl font-bold tracking-tight text-white">Playground</h1>
                    <p className="mt-2 text-sm text-zinc-400">
                        Create and manage your own agents, each with its own model, tools and instructions.
                    </p>

                    <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900">
                        <button
                            onClick={() => setAddPanelOpen(open => !open)}
                            aria-expanded={addPanelOpen}
                            aria-controls="add-panel"
                            className="flex w-full cursor-pointer items-center justify-between gap-3 px-6 py-4 text-sm font-medium text-zinc-300 transition hover:text-white"
                        >
                            <span className="flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Create an agent
                            </span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-zinc-500 transition-transform duration-200 ${addPanelOpen ? 'rotate-180' : ''}`}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                        {/* Hidden rather than unmounted so in-progress input survives collapsing */}
                        <div id="add-panel" className={`border-t border-zinc-800/60 px-6 pb-6 pt-4 ${addPanelOpen ? '' : 'hidden'}`}>
                            <AgentForm
                                offerings={offerings}
                                providerConfigs={providerConfigs}
                                mcps={mcps}
                                onSave={handleSave}
                            />
                            {saveError && <p className="mt-3 text-xs text-red-400">{saveError}</p>}
                        </div>
                    </div>

                    <div className="mt-6 space-y-2">
                        <h2 className="text-sm font-medium text-zinc-400">Your agents</h2>
                        {agentsLoading ? (
                            <p className="text-xs text-zinc-500">Loading…</p>
                        ) : agents.length === 0 ? (
                            <p className="text-xs text-zinc-500">You haven't created any agents yet.</p>
                        ) : (
                            agents.map(agent => (
                                <div
                                    key={agent.id}
                                    className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
                                >
                                    <button
                                        onClick={() => setSelectedAgentId(agent.id)}
                                        className="group flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                                    >
                                        <AgentIcon />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm text-white group-hover:text-amber-300">{agent.name}</p>
                                            <p className="truncate text-xs text-zinc-600">{agent.id.slice(0, 18)}</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(agent.id)}
                                        disabled={deletingIds.has(agent.id)}
                                        aria-label={`Delete ${agent.name}`}
                                        className="shrink-0 cursor-pointer rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-red-400 disabled:pointer-events-none disabled:opacity-50"
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

            {selectedAgentId && (
                <AgentDetailsDialog
                    key={selectedAgentId}
                    agentId={selectedAgentId}
                    mcps={mcps}
                    onClose={closeAgentDetails}
                />
            )}
        </div>
    )
}
