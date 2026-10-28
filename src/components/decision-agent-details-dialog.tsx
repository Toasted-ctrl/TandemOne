import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { DecisionAgentForm } from './decision-agent-form'
import { getDecisionAgent, type DecisionAgent, type DecisionAgentPayload, type DecisionQuestion } from '../services/get-decision-agent'
import type { ProvidersOffering } from '../services/get-models'
import type { ProviderConfiguration } from '../services/get-provider-configuration'
import { updateDecisionAgent } from '../services/update-decision-agent'

type DecisionAgentDetailsDialogProps = {
    agentId: string
    offerings: ProvidersOffering | null
    providerConfigs: ProviderConfiguration[]
    onClose: () => void
    onUpdated: (agent: DecisionAgent) => void
}

const QUESTION_TYPE_LABELS: Record<DecisionQuestion['type'], string> = {
    choice: 'Choice',
    score: 'Score',
    noul: 'Noul (0 to 1)',
}

function SectionHeading({ children }: { children: ReactNode }) {
    return <h3 className="text-xs font-medium uppercase tracking-wide text-ui-500">{children}</h3>
}

function Pill({ children }: { children: ReactNode }) {
    return <span className="rounded bg-ui-800 px-2 py-0.5 text-xs text-ui-300">{children}</span>
}

function QuestionDetails({ question }: { question: DecisionQuestion }) {
    return (
        <div className="space-y-2 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-ui-50">{question.name}</span>
                <span className="shrink-0 text-xs text-ui-500">{QUESTION_TYPE_LABELS[question.type]}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-ui-300">{question.instructions}</p>
            {question.type === 'choice' && (
                <div className="flex flex-wrap gap-1.5">
                    {question.options.map(option => <Pill key={option}>{option}</Pill>)}
                </div>
            )}
            {question.type === 'score' && (
                <div className="flex flex-wrap gap-1.5">
                    {question.legend.map((label, i) => <Pill key={i}>{i}. {label}</Pill>)}
                </div>
            )}
        </div>
    )
}

export function DecisionAgentDetailsDialog({ agentId, offerings, providerConfigs, onClose, onUpdated }: DecisionAgentDetailsDialogProps) {
    const [agent, setAgent] = useState<DecisionAgent | null>(null)
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

    async function handleSave(payload: DecisionAgentPayload): Promise<boolean> {
        setSaveError(null)
        try {
            const updated = await updateDecisionAgent(agentId, payload)
            setAgent(updated)
            setEditing(false)
            setDirty(false)
            onUpdated(updated)
            return true
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Failed to update decision agent')
            return false
        }
    }

    useEffect(() => {
        let cancelled = false
        getDecisionAgent(agentId)
            .then(res => { if (!cancelled) setAgent(res) })
            .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load decision agent') })
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={requestClose} />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="decision-agent-details-title"
                className="relative flex max-h-[85svh] w-full max-w-2xl flex-col rounded-xl border border-ui-800 bg-ui-900 shadow-xl"
            >
                <div className="flex items-start justify-between gap-4 border-b border-ui-800/60 px-6 py-4">
                    <div className="min-w-0">
                        <h2 id="decision-agent-details-title" className="truncate text-lg font-semibold text-ui-50">
                            {agent?.name ?? (error ? 'Decision agent' : 'Loading…')}
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
                    {error ? (
                        <p className="text-sm text-red-400">{error}</p>
                    ) : !agent ? (
                        <p className="text-sm text-ui-500">Loading agent…</p>
                    ) : editing ? (
                        <div>
                            <DecisionAgentForm
                                offerings={offerings}
                                providerConfigs={providerConfigs}
                                initialAgent={agent}
                                onSave={handleSave}
                                onCancel={cancelEditing}
                                onDirtyChange={setDirty}
                            />
                            {saveError && <p className="mt-3 text-xs text-red-400">{saveError}</p>}
                        </div>
                    ) : (
                        <>
                            {agent.description && (
                                <p className="whitespace-pre-wrap text-sm text-ui-300">{agent.description}</p>
                            )}

                            <section className="space-y-2">
                                <SectionHeading>Model</SectionHeading>
                                <p className="text-sm text-ui-300">
                                    <span className="text-ui-500">{agent.model.provider} / </span>
                                    {agent.model.name}
                                </p>
                            </section>

                            <section className="space-y-2">
                                <SectionHeading>State</SectionHeading>
                                <p className="text-xs text-ui-500">
                                    {agent.state.type === 'text'
                                        ? 'Callers send state as a single string.'
                                        : 'Callers send state as an object with these named fields.'}
                                </p>
                                {agent.state.description && (
                                    <p className="whitespace-pre-wrap text-sm text-ui-300">{agent.state.description}</p>
                                )}
                                {agent.state.fields.length > 0 && (
                                    <div className="divide-y divide-ui-800 rounded-lg border border-ui-800">
                                        {agent.state.fields.map(field => (
                                            <div key={field.name} className="flex items-baseline gap-3 px-4 py-2">
                                                <span className="shrink-0 text-sm text-brand-300">{field.name}</span>
                                                <span className={`text-sm ${field.description ? 'text-ui-300' : 'italic text-ui-500'}`}>
                                                    {field.description ?? 'No description'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section className="space-y-2">
                                <SectionHeading>Questions</SectionHeading>
                                <div className="divide-y divide-ui-800 rounded-lg border border-ui-800">
                                    {agent.questions.map(question => <QuestionDetails key={question.name} question={question} />)}
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
