import { useEffect, useId, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AppHeader } from '../components/app-header'
import { ChatAgentSelector } from '../components/chat-agent-selector'
import { QuestionDetails } from '../components/decision-agent-details-dialog'
import { getAgents, type AgentSummary } from '../services/get-agents'
import { getDecisionAgent, type DecisionAgent } from '../services/get-decision-agent'
import { getUser } from '../services/get-user'
import { runDecision, type DecisionAnswer, type DecisionResult } from '../services/run-decision'

const inputClassName = 'mt-1.5 w-full resize-y rounded-lg border border-ui-700 bg-ui-800 px-3 py-2 text-sm text-ui-50 placeholder-ui-500 outline-none focus:border-ui-500 focus:ring-1 focus:ring-ui-500'

function SectionHeading({ children }: { children: string }) {
    return <h2 className="text-xs font-medium uppercase tracking-wide text-ui-500">{children}</h2>
}

function formatAnswerValue(value: unknown): string {
    if (typeof value === 'string') return value
    return JSON.stringify(value, null, 2)
}

function AnswerDetails({ name, answer }: { name: string; answer: DecisionAnswer | undefined }) {
    const entries = answer ? Object.entries(answer) : []
    return (
        <div className="space-y-2 px-4 py-3">
            <span className="block truncate text-sm font-medium text-ui-50">{name}</span>
            {entries.length === 0 ? (
                <p className="text-sm text-ui-500">No answer returned.</p>
            ) : (
                <dl className="space-y-1.5">
                    {entries.map(([key, value]) => (
                        <div key={key}>
                            <dt className="text-xs text-ui-500">{key}</dt>
                            <dd className="whitespace-pre-wrap break-words text-sm text-ui-300">{formatAnswerValue(value)}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </div>
    )
}

// The inputs are generated from the agent's state definition, so callers can only send the shape it expects
function DecisionRunner({ agent }: { agent: DecisionAgent }) {
    const idPrefix = useId()
    const [text, setText] = useState('')
    const [fieldValues, setFieldValues] = useState<Record<string, string>>(
        () => Object.fromEntries(agent.state.fields.map(f => [f.name, '']))
    )
    const [running, setRunning] = useState(false)
    const [result, setResult] = useState<DecisionResult | null>(null)
    const [runError, setRunError] = useState<string | null>(null)

    const state = agent.state.type === 'text'
        ? text.trim()
        : Object.fromEntries(agent.state.fields.map(f => [f.name, fieldValues[f.name].trim()]))
    const missingFields = agent.state.fields.filter(f => !fieldValues[f.name].trim()).map(f => f.name)
    const complete = agent.state.type === 'text' ? text.trim().length > 0 : missingFields.length === 0

    async function handleRun() {
        if (!complete || running) return
        setRunning(true)
        setRunError(null)
        try {
            setResult(await runDecision({ agent_id: agent.id, state }))
        } catch (err) {
            setRunError(err instanceof Error ? err.message : 'Failed to run decision')
        } finally {
            setRunning(false)
        }
    }

    // Questions the backend answered that the agent doesn't list are still shown
    const answerNames = result
        ? [...agent.questions.map(q => q.name), ...Object.keys(result.answers).filter(n => !agent.questions.some(q => q.name === n))]
        : []

    return (
        <div className="space-y-6">
            <section className="space-y-3 rounded-xl border border-ui-800 bg-ui-900 px-6 py-5">
                <SectionHeading>State</SectionHeading>
                {agent.state.description && (
                    <p className="whitespace-pre-wrap text-sm text-ui-400">{agent.state.description}</p>
                )}
                {agent.state.type === 'text' ? (
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Describe the situation for the agent to decide on…"
                        aria-label="State"
                        rows={5}
                        className={inputClassName}
                    />
                ) : (
                    agent.state.fields.map(field => (
                        <div key={field.name}>
                            <label htmlFor={`${idPrefix}-${field.name}`} className="block text-sm font-medium text-ui-300">
                                {field.name}
                            </label>
                            {field.description && <p className="mt-0.5 text-xs text-ui-500">{field.description}</p>}
                            <textarea
                                id={`${idPrefix}-${field.name}`}
                                value={fieldValues[field.name]}
                                onChange={e => setFieldValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                                rows={2}
                                className={inputClassName}
                            />
                        </div>
                    ))
                )}
            </section>

            <section className="space-y-2">
                <SectionHeading>Questions</SectionHeading>
                <div className="divide-y divide-ui-800 rounded-lg border border-ui-800 bg-ui-900">
                    {agent.questions.map(question => <QuestionDetails key={question.name} question={question} />)}
                </div>
            </section>

            <details>
                <summary className="cursor-pointer text-xs font-medium text-ui-400 hover:text-ui-200">Preview state</summary>
                <pre className="mt-1.5 max-h-72 overflow-auto rounded-lg border border-ui-700 bg-ui-800 p-3 text-xs text-ui-300">
                    {JSON.stringify({ state }, null, 2)}
                </pre>
            </details>

            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={handleRun}
                    disabled={!complete || running}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-ui-800 bg-ui-900 px-4 py-2.5 text-sm font-medium text-ui-300 transition hover:border-ui-700 hover:bg-ui-800/60 hover:text-ui-50 disabled:pointer-events-none disabled:opacity-50"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="6 3 20 12 6 21 6 3" />
                    </svg>
                    {running ? 'Running…' : 'Run decision'}
                </button>
                {!complete && (
                    <p className="text-xs text-ui-500">
                        {agent.state.type === 'text' ? 'Describe the state first.' : `Fill in: ${missingFields.join(', ')}.`}
                    </p>
                )}
                {runError && <p className="text-xs text-red-400">{runError}</p>}
            </div>

            {result && (
                <section className="space-y-2">
                    <SectionHeading>Answers</SectionHeading>
                    <div className="divide-y divide-ui-800 rounded-lg border border-ui-800 bg-ui-900">
                        {answerNames.map(name => <AnswerDetails key={name} name={name} answer={result.answers[name]} />)}
                    </div>
                    <details>
                        <summary className="cursor-pointer text-xs font-medium text-ui-400 hover:text-ui-200">Raw response</summary>
                        <pre className="mt-1.5 max-h-72 overflow-auto rounded-lg border border-ui-700 bg-ui-800 p-3 text-xs text-ui-300">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </details>
                </section>
            )}
        </div>
    )
}

export function DecisionsPage() {
    const navigate = useNavigate()
    // The selected agent lives in the URL (?agent=<id>) so it survives a refresh
    const [searchParams, setSearchParams] = useSearchParams()
    const agentId = searchParams.get('agent')

    // Null until the list is first fetched
    const [agents, setAgents] = useState<AgentSummary[] | null>(null)
    // May briefly belong to the previous selection while the next one loads
    const [agent, setAgent] = useState<DecisionAgent | null>(null)
    const [loadError, setLoadError] = useState<{ agentId: string; message: string } | null>(null)

    useEffect(() => {
        getUser().catch(() => navigate('/login', { replace: true }))
    }, [navigate])

    useEffect(() => {
        getAgents('All', 'Decision')
            .then(res => setAgents(res.agents))
            .catch(err => {
                console.error(err)
                setAgents([])
            })
    }, [])

    useEffect(() => {
        if (!agentId) return

        let cancelled = false
        getDecisionAgent(agentId)
            .then(res => { if (!cancelled) setAgent(res) })
            .catch(err => {
                if (!cancelled) setLoadError({ agentId, message: err instanceof Error ? err.message : 'Failed to load decision agent' })
            })
        return () => { cancelled = true }
    }, [agentId])

    const currentAgent = agent?.id === agentId ? agent : null
    const error = loadError?.agentId === agentId ? loadError.message : null

    return (
        <div className="flex min-h-svh flex-col bg-ui-950 bg-grid">
            <AppHeader />
            <div className="flex-1 px-4 py-10">
                <div className="mx-auto max-w-xl">
                    <h1 className="text-2xl font-bold tracking-tight text-ui-50">Decisions</h1>
                    <p className="mt-2 text-sm text-ui-400">
                        Pick a decision agent, describe the situation, and let it answer its questions.
                    </p>

                    <div className="mt-8 flex items-center gap-1 rounded-lg border border-ui-700 bg-ui-800 p-1">
                        <ChatAgentSelector
                            agents={agents}
                            selectedAgentId={agentId}
                            onSelect={id => setSearchParams({ agent: id }, { replace: true })}
                            placement="down"
                            label="Decision agents"
                        />
                    </div>
                    {agents?.length === 0 && (
                        <p className="mt-2 text-xs text-ui-500">
                            You don't have any decision agents yet.{' '}
                            <Link to="/playground?tab=decision" className="text-brand-400 hover:text-brand-300">
                                Create one in the Playground.
                            </Link>
                        </p>
                    )}

                    {agentId && (
                        <div className="mt-6">
                            {error ? (
                                <p className="text-sm text-red-400">{error}</p>
                            ) : !currentAgent ? (
                                <p className="text-sm text-ui-500">Loading agent…</p>
                            ) : (
                                <>
                                    <div className="mb-6 space-y-1">
                                        {currentAgent.description && (
                                            <p className="whitespace-pre-wrap text-sm text-ui-300">{currentAgent.description}</p>
                                        )}
                                        <p className="text-xs text-ui-500">
                                            {currentAgent.model.provider} / {currentAgent.model.name}
                                        </p>
                                    </div>
                                    {/* Keyed so switching agents starts with empty inputs for the new state shape */}
                                    <DecisionRunner key={currentAgent.id} agent={currentAgent} />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
