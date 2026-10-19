import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AgentForm } from './agent-form'
import { getPlaygroundAgent, type Agent, type AgentPayload } from '../services/get-playground-agent'
import type { Mcp } from '../services/get-mcps'
import type { ProvidersOffering } from '../services/get-models'
import type { ProviderConfiguration } from '../services/get-provider-configuration'
import { updatePlaygroundAgent } from '../services/update-playground-agent'

type AgentDetailsDialogProps = {
    agentId: string
    // Used to show MCP names instead of ids
    mcps: Mcp[]
    offerings: ProvidersOffering | null
    providerConfigs: ProviderConfiguration[]
    onClose: () => void
    onUpdated: (agent: Agent) => void
}

function SectionHeading({ children }: { children: ReactNode }) {
    return <h3 className="text-xs font-medium uppercase tracking-wide text-ui-500">{children}</h3>
}

function Pill({ children }: { children: ReactNode }) {
    return <span className="rounded bg-ui-800 px-2 py-0.5 text-xs text-ui-300">{children}</span>
}

export function AgentDetailsDialog({ agentId, mcps, offerings, providerConfigs, onClose, onUpdated }: AgentDetailsDialogProps) {
    const [agent, setAgent] = useState<Agent | null>(null)
    const [error, setError] = useState<string | null>(null)

    const [editing, setEditing] = useState(false)
    const [dirty, setDirty] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    const confirmDiscard = useCallback(
        () => !dirty || window.confirm('Discard your unsaved changes to this agent?'),
        [dirty]
    )

    const requestClose = useCallback(() => {
        if (confirmDiscard()) onClose()
    }, [confirmDiscard, onClose])

    function startEditing() {
        setSaveError(null)
        setEditing(true)
    }

    function cancelEditing() {
        if (!confirmDiscard()) return
        setEditing(false)
        setDirty(false)
        setSaveError(null)
    }

    async function handleSave(payload: AgentPayload): Promise<boolean> {
        setSaveError(null)
        try {
            const updated = await updatePlaygroundAgent(agentId, payload)
            setAgent(updated)
            setEditing(false)
            setDirty(false)
            onUpdated(updated)
            return true
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Failed to update agent')
            return false
        }
    }

    useEffect(() => {
        let cancelled = false
        getPlaygroundAgent(agentId)
            .then(res => { if (!cancelled) setAgent(res) })
            .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load agent') })
        return () => { cancelled = true }
    }, [agentId])

    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') requestClose()
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [requestClose])

    useEffect(() => {
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = previousOverflow }
    }, [])

    const parameters = agent
        ? ([
            ['Temperature', agent.model.parameters.temperature],
            ['Top P', agent.model.parameters.top_p],
            ['Top K', agent.model.parameters.top_k],
        ] as const)
        : []

    const enabledTools = agent
        ? [
            agent.tools.user_vs_files && 'User Files',
            agent.tools.user_vs_memories && 'User Memories',
            agent.tools.user_vs_skills && 'User Skill Discovery',
            agent.tools.web_search && 'Web Search',
        ].filter((t): t is string => !!t)
        : []

    const mcpNames = agent?.tools.mcp_ids.map(id => mcps.find(m => m.id === id)?.name ?? id) ?? []

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={requestClose} />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="agent-details-title"
                className="relative flex max-h-[85svh] w-full max-w-2xl flex-col rounded-xl border border-ui-800 bg-ui-900 shadow-xl"
            >
                <div className="flex items-start justify-between gap-4 border-b border-ui-800/60 px-6 py-4">
                    <div className="min-w-0">
                        <h2 id="agent-details-title" className="truncate text-lg font-semibold text-ui-50">
                            {agent?.name ?? (error ? 'Agent' : 'Loading…')}
                        </h2>
                        <p className="truncate text-xs text-ui-600">{agentId}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        {agent && !editing && (
                            <button
                                onClick={startEditing}
                                className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-ui-400 transition hover:bg-ui-800 hover:text-ui-200"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
                                </svg>
                                Edit
                            </button>
                        )}
                        <button
                            onClick={requestClose}
                            aria-label="Close"
                            className="flex shrink-0 cursor-pointer items-center justify-center rounded-lg p-1.5 text-ui-400 transition hover:bg-ui-800 hover:text-ui-200"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
                    {agent && !agent.is_encrypted && (
                        <div className="flex items-start gap-2.5 rounded-lg border border-amber-800 bg-amber-950 px-4 py-3 text-sm text-amber-300">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <path d="M12 9v4" />
                                <path d="M12 17h.01" />
                            </svg>
                            <p>
                                This agent was stored using a legacy format and isn't encrypted yet.
                                Edit and save it again to encrypt it.
                            </p>
                        </div>
                    )}
                    {error ? (
                        <p className="text-sm text-red-400">{error}</p>
                    ) : !agent ? (
                        <p className="text-sm text-ui-500">Loading agent…</p>
                    ) : editing ? (
                        <div>
                            <AgentForm
                                offerings={offerings}
                                providerConfigs={providerConfigs}
                                mcps={mcps}
                                initialAgent={agent}
                                onSave={handleSave}
                                onCancel={cancelEditing}
                                onDirtyChange={setDirty}
                                allowUnchangedSave={!agent.is_encrypted}
                            />
                            {saveError && <p className="mt-3 text-xs text-red-400">{saveError}</p>}
                        </div>
                    ) : (
                        <>
                            <section className="space-y-2">
                                <SectionHeading>Model</SectionHeading>
                                <p className="text-sm text-ui-300">
                                    <span className="text-ui-500">{agent.model.provider} / </span>
                                    {agent.model.name}
                                </p>
                            </section>

                            <section className="space-y-2">
                                <SectionHeading>Sampling</SectionHeading>
                                <div className="divide-y divide-ui-800 rounded-lg border border-ui-800">
                                    {parameters.map(([label, value]) => (
                                        <div key={label} className="flex items-center justify-between px-4 py-2">
                                            <span className="text-sm text-ui-300">{label}</span>
                                            <span className={`text-sm tabular-nums ${value != null ? 'text-brand-300' : 'italic text-ui-500'}`}>
                                                {value ?? 'Default'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-2">
                                <SectionHeading>Tools</SectionHeading>
                                {enabledTools.length === 0 && mcpNames.length === 0 ? (
                                    <p className="text-sm text-ui-500">This agent has no tools enabled.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {enabledTools.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {enabledTools.map(tool => <Pill key={tool}>{tool}</Pill>)}
                                            </div>
                                        )}
                                        {mcpNames.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="text-xs text-ui-500">MCP servers:</span>
                                                {mcpNames.map(mcpName => <Pill key={mcpName}>{mcpName}</Pill>)}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </section>

                            <section className="space-y-2">
                                <SectionHeading>System prompt</SectionHeading>
                                <p className="whitespace-pre-wrap rounded-lg border border-ui-800 bg-ui-950/50 px-4 py-3 text-sm leading-relaxed text-ui-300">
                                    {agent.system_prompt}
                                </p>
                            </section>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
