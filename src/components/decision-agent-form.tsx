import { useEffect, useId, useState } from 'react'
import { ChatModelSelector } from './chat-model-selector'
import type { DecisionAgentPayload, DecisionQuestion, DecisionState } from '../services/get-decision-agent'
import type { ProvidersOffering } from '../services/get-models'
import type { ProviderConfiguration } from '../services/get-provider-configuration'

type DecisionAgentFormProps = {
    offerings: ProvidersOffering | null
    providerConfigs: ProviderConfiguration[]
    onSave: (agent: DecisionAgentPayload) => Promise<boolean>
    // When set, the form edits this agent instead of creating a new one
    initialAgent?: DecisionAgentPayload
    onCancel?: () => void
    onDirtyChange?: (dirty: boolean) => void
}

type QuestionType = DecisionQuestion['type']

type EntryDraft = { id: number; label: string }

// Options and levels are kept separately so switching type doesn't discard input
type QuestionDraft = {
    id: number
    name: string
    type: QuestionType
    instructions: string
    options: EntryDraft[]
    levels: EntryDraft[]
}

const QUESTION_TYPES: Record<QuestionType, { label: string; hint: string }> = {
    choice: { label: 'Choice', hint: 'Pick one of a set of named options.' },
    score: { label: 'Score', hint: 'Rate on an ordered scale, lowest first. Levels are numbered from 0.' },
    noul: { label: 'Noul', hint: 'Answer with a single value between 0 and 1.' },
}

type StateType = DecisionState['type']

type StateFieldDraft = { id: number; name: string; description: string }

const STATE_TYPES: Record<StateType, { label: string; hint: string }> = {
    text: { label: 'Text', hint: 'Callers send state as a single string.' },
    fields: { label: 'Fields', hint: 'Callers send state as an object with these named fields.' },
}

const inputClassName ='mt-1.5 w-full rounded-lg border border-ui-700 bg-ui-800 px-3 py-2 text-sm text-ui-50 placeholder-ui-500 outline-none focus:border-ui-500 focus:ring-1 focus:ring-ui-500'
const rowInputClassName = 'min-w-0 flex-1 rounded-lg border border-ui-700 bg-ui-800 px-3 py-1.5 text-sm text-ui-50 placeholder-ui-500 outline-none focus:border-ui-500 focus:ring-1 focus:ring-ui-500'
const smallButtonClassName = 'cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium text-ui-400 transition hover:bg-ui-800 hover:text-ui-200'

let nextDraftId = 0

function toEntryDrafts(labels: string[]): EntryDraft[] {
    return labels.map(label => ({ id: nextDraftId++, label }))
}

// Choice and score questions need at least two entries, so new questions start with two blank rows
function newQuestion(): QuestionDraft {
    return {
        id: nextDraftId++,
        name: '',
        type: 'choice',
        instructions: '',
        options: toEntryDrafts(['', '']),
        levels: toEntryDrafts(['', '']),
    }
}

function toQuestionDraft(question: DecisionQuestion): QuestionDraft {
    return {
        ...newQuestion(),
        name: question.name,
        type: question.type,
        instructions: question.instructions,
        ...(question.type === 'choice' && { options: toEntryDrafts(question.options) }),
        ...(question.type === 'score' && { levels: toEntryDrafts(question.legend) }),
    }
}

function newStateField(): StateFieldDraft {
    return { id: nextDraftId++, name: '', description: '' }
}

function filledLabels(entries: EntryDraft[]): string[] {
    return entries.map(e => e.label.trim()).filter(Boolean)
}

// Blank option and level rows are dropped
function buildQuestion(draft: QuestionDraft): DecisionQuestion {
    const base = { name: draft.name.trim(), instructions: draft.instructions.trim() }
    if (draft.type === 'choice') return { ...base, type: 'choice', options: filledLabels(draft.options) }
    if (draft.type === 'score') return { ...base, type: 'score', legend: filledLabels(draft.levels) }
    return { ...base, type: 'noul' }
}

// Blank field rows are dropped; the backend rejects fields on 'text' state
function buildState(type: StateType, description: string, fields: StateFieldDraft[]): DecisionState {
    return {
        type,
        description: description.trim() || null,
        fields: type === 'fields'
            ? fields
                .filter(f => f.name.trim())
                .map(f => ({ name: f.name.trim(), description: f.description.trim() || null }))
            : [],
    }
}

function hasDuplicates(values: string[]): boolean {
    return new Set(values).size !== values.length
}

// Mirrors the backend's validation so the save button only enables for payloads it accepts
function findProblem(payload: DecisionAgentPayload): string | null {
    if (!payload.name) return 'Give the agent a name.'
    if (!payload.model.provider || !payload.model.name) return 'Pick a model.'
    if (payload.state.type === 'fields') {
        if (payload.state.fields.length === 0) return 'Add at least one state field.'
        if (hasDuplicates(payload.state.fields.map(f => f.name))) return 'State field names must be unique.'
    }
    if (payload.questions.length === 0) return 'Add at least one question.'
    for (const [i, question] of payload.questions.entries()) {
        const label = `Question ${i + 1}`
        if (!question.name) return `${label} needs a name.`
        if (!question.instructions) return `${label} needs instructions.`
        if (question.type === 'choice') {
            if (question.options.length < 2) return `${label} needs at least two options.`
            if (hasDuplicates(question.options)) return `${label} has duplicate options.`
        }
        if (question.type === 'score' && question.legend.length < 2) return `${label} needs at least two levels.`
    }
    if (hasDuplicates(payload.questions.map(q => q.name))) return 'Question names must be unique.'
    return null
}

function SegmentedToggle<T extends string>({ options, value, onChange }: {
    options: Record<T, { label: string; hint: string }>
    value: T
    onChange: (value: T) => void
}) {
    return (
        <div className="mt-1.5 inline-flex gap-1 rounded-lg border border-ui-700 bg-ui-800 p-1">
            {(Object.keys(options) as T[]).map(key => (
                <button
                    key={key}
                    onClick={() => onChange(key)}
                    title={options[key].hint}
                    className={`cursor-pointer rounded-md px-3 py-1 text-sm font-medium transition ${
                        value === key ? 'bg-ui-700 text-ui-50' : 'text-ui-400 hover:text-ui-200'
                    }`}
                >
                    {options[key].label}
                </button>
            ))}
        </div>
    )
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            aria-label={label}
            className="shrink-0 cursor-pointer rounded-md p-1.5 text-ui-500 transition hover:bg-ui-800 hover:text-red-400"
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
            </svg>
        </button>
    )
}

type QuestionEditorProps = {
    question: QuestionDraft
    index: number
    duplicateName: boolean
    onChange: (question: QuestionDraft) => void
    onRemove: () => void
}

function QuestionEditor({ question, index, duplicateName, onChange, onRemove }: QuestionEditorProps) {
    const idPrefix = useId()

    function update(patch: Partial<QuestionDraft>) {
        onChange({ ...question, ...patch })
    }

    function updateOption(id: number, label: string) {
        update({ options: question.options.map(o => (o.id === id ? { ...o, label } : o)) })
    }

    function updateLevel(id: number, label: string) {
        update({ levels: question.levels.map(l => (l.id === id ? { ...l, label } : l)) })
    }

    return (
        <div className="space-y-3 rounded-lg border border-ui-700 bg-ui-800/40 p-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ui-400">Question {index + 1}</span>
                <RemoveButton label={`Remove question ${index + 1}`} onClick={onRemove} />
            </div>

            <div className="flex flex-wrap gap-3">
                <div className="min-w-40 flex-1">
                    <label htmlFor={`${idPrefix}-name`} className="block text-xs font-medium text-ui-300">
                        Name
                    </label>
                    <input
                        id={`${idPrefix}-name`}
                        type="text"
                        value={question.name}
                        onChange={e => update({ name: e.target.value })}
                        placeholder="e.g. resolution"
                        className={inputClassName}
                    />
                    {duplicateName && <p className="mt-1 text-xs text-red-400">Another question already uses this name.</p>}
                </div>
                <div>
                    <span className="block text-xs font-medium text-ui-300">Type</span>
                    <SegmentedToggle options={QUESTION_TYPES} value={question.type} onChange={type => update({ type })} />
                </div>
            </div>
            <p className="text-xs text-ui-500">{QUESTION_TYPES[question.type].hint}</p>

            <div>
                <label htmlFor={`${idPrefix}-instructions`} className="block text-xs font-medium text-ui-300">
                    Instructions
                </label>
                <textarea
                    id={`${idPrefix}-instructions`}
                    value={question.instructions}
                    onChange={e => update({ instructions: e.target.value })}
                    placeholder="e.g. Pick the support resolution that matches policy."
                    rows={2}
                    className={`${inputClassName} resize-y`}
                />
            </div>

            {question.type === 'choice' && (
                <div>
                    <span className="block text-xs font-medium text-ui-300">Options</span>
                    <div className="mt-1.5 space-y-1.5">
                        {question.options.map((option, i) => (
                            <div key={option.id} className="flex items-center gap-1.5">
                                <input
                                    type="text"
                                    value={option.label}
                                    onChange={e => updateOption(option.id, e.target.value)}
                                    placeholder="e.g. refund"
                                    aria-label={`Option ${i + 1}`}
                                    className={rowInputClassName}
                                />
                                <RemoveButton
                                    label={`Remove option ${i + 1}`}
                                    onClick={() => update({ options: question.options.filter(o => o.id !== option.id) })}
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => update({ options: [...question.options, ...toEntryDrafts([''])] })}
                        className={`mt-1.5 ${smallButtonClassName}`}
                    >
                        + Add option
                    </button>
                </div>
            )}

            {question.type === 'score' && (
                <div>
                    <span className="block text-xs font-medium text-ui-300">Scale (lowest first)</span>
                    <div className="mt-1.5 space-y-1.5">
                        {question.levels.map((level, i) => (
                            <div key={level.id} className="flex items-center gap-1.5">
                                <span className="w-5 shrink-0 text-right text-xs text-ui-500">{i}.</span>
                                <input
                                    type="text"
                                    value={level.label}
                                    onChange={e => updateLevel(level.id, e.target.value)}
                                    placeholder="e.g. routine"
                                    aria-label={`Level ${i}`}
                                    className={rowInputClassName}
                                />
                                <RemoveButton
                                    label={`Remove level ${i}`}
                                    onClick={() => update({ levels: question.levels.filter(l => l.id !== level.id) })}
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => update({ levels: [...question.levels, ...toEntryDrafts([''])] })}
                        className={`mt-1.5 ${smallButtonClassName}`}
                    >
                        + Add level
                    </button>
                </div>
            )}
        </div>
    )
}

export function DecisionAgentForm({ offerings, providerConfigs, onSave, initialAgent, onCancel, onDirtyChange }: DecisionAgentFormProps) {
    // The create and edit forms can be in the DOM together, so ids must be unique
    const idPrefix = useId()
    const [name, setName] = useState(initialAgent?.name ?? '')
    const [description, setDescription] = useState(initialAgent?.description ?? '')
    const [provider, setProvider] = useState(initialAgent?.model.provider ?? '')
    const [model, setModel] = useState(initialAgent?.model.name ?? '')
    const [stateType, setStateType] = useState<StateType>(initialAgent?.state.type ?? 'text')
    const [stateDescription, setStateDescription] = useState(initialAgent?.state.description ?? '')
    const [stateFields, setStateFields] = useState<StateFieldDraft[]>(() =>
        initialAgent?.state.fields.length
            ? initialAgent.state.fields.map(f => ({ id: nextDraftId++, name: f.name, description: f.description ?? '' }))
            : [newStateField()]
    )
    const [questions, setQuestions] = useState<QuestionDraft[]>(() =>
        initialAgent ? initialAgent.questions.map(toQuestionDraft) : [newQuestion()]
    )
    const [saving, setSaving] = useState(false)

    function buildPayload(): DecisionAgentPayload {
        return {
            name: name.trim(),
            description: description.trim() || null,
            model: { provider, name: model },
            state: buildState(stateType, stateDescription, stateFields),
            questions: questions.map(buildQuestion),
        }
    }

    const payload = buildPayload()
    const [initialSnapshot] = useState(() => JSON.stringify(payload))
    const dirty = JSON.stringify(payload) !== initialSnapshot

    useEffect(() => {
        onDirtyChange?.(dirty)
    }, [dirty, onDirtyChange])

    function updateStateField(id: number, patch: Partial<StateFieldDraft>) {
        setStateFields(prev => prev.map(f => (f.id === id ? { ...f, ...patch } : f)))
    }

    const nameCounts = new Map<string, number>()
    for (const q of questions) {
        const name = q.name.trim()
        if (name) nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1)
    }

    const problem = findProblem(payload)
    const canSave = (!initialAgent || dirty) && problem === null

    async function handleSave() {
        if (!canSave) return

        setSaving(true)
        const saved = await onSave(payload)
        setSaving(false)

        // An edit form is closed by its owner after saving, so only the create form resets
        if (saved && !initialAgent) {
            setName('')
            setDescription('')
            setProvider('')
            setModel('')
            setStateType('text')
            setStateDescription('')
            setStateFields([newStateField()])
            setQuestions([newQuestion()])
        }
    }

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor={`${idPrefix}-name`} className="block text-sm font-medium text-ui-300">
                    Name
                </label>
                <input
                    id={`${idPrefix}-name`}
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Refund triage"
                    className={inputClassName}
                />
            </div>
            <div>
                <label htmlFor={`${idPrefix}-description`} className="block text-sm font-medium text-ui-300">
                    Description <span className="font-normal text-ui-500">(optional)</span>
                </label>
                <textarea
                    id={`${idPrefix}-description`}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What does this agent decide, and when should it be used?"
                    rows={2}
                    className={`${inputClassName} resize-y`}
                />
            </div>
            <div>
                <span className="block text-sm font-medium text-ui-300">Model</span>
                <div className="mt-1.5 flex flex-wrap items-center gap-1 rounded-lg border border-ui-700 bg-ui-800 p-1">
                    {offerings ? (
                        <ChatModelSelector
                            offerings={offerings}
                            providerConfigs={providerConfigs}
                            selectedProvider={provider}
                            selectedModel={model}
                            onSelect={(p, m) => {
                                setProvider(p)
                                setModel(m)
                            }}
                            placement="down"
                            // Decision agents only run on System One models
                            capability="system_one"
                        />
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-ui-500">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500/60" />
                            Loading models...
                        </div>
                    )}
                </div>
            </div>
            <div>
                <span className="block text-sm font-medium text-ui-300">State</span>
                <p className="mt-0.5 text-xs text-ui-500">
                    Describe the situation callers should send for the agent to decide on.
                </p>
                <SegmentedToggle options={STATE_TYPES} value={stateType} onChange={setStateType} />
                <p className="mt-1.5 text-xs text-ui-500">{STATE_TYPES[stateType].hint}</p>
                <textarea
                    value={stateDescription}
                    onChange={e => setStateDescription(e.target.value)}
                    placeholder="e.g. The support ticket text, including when the order was placed and whether it has shipped."
                    aria-label="State description"
                    rows={2}
                    className={`${inputClassName} resize-y`}
                />
                {stateType === 'fields' && (
                    <div className="mt-1.5">
                        <div className="space-y-1.5">
                            {stateFields.map((field, i) => (
                                <div key={field.id} className="flex items-center gap-1.5">
                                    <input
                                        type="text"
                                        value={field.name}
                                        onChange={e => updateStateField(field.id, { name: e.target.value })}
                                        placeholder="e.g. expectations"
                                        aria-label={`Field ${i + 1} name`}
                                        className={`${rowInputClassName} max-w-40`}
                                    />
                                    <input
                                        type="text"
                                        value={field.description}
                                        onChange={e => updateStateField(field.id, { description: e.target.value })}
                                        placeholder="e.g. What the result was expected to be"
                                        aria-label={`Field ${i + 1} description`}
                                        className={rowInputClassName}
                                    />
                                    <RemoveButton
                                        label={`Remove field ${i + 1}`}
                                        onClick={() => setStateFields(prev => prev.filter(f => f.id !== field.id))}
                                    />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setStateFields(prev => [...prev, newStateField()])}
                            className={`mt-1.5 ${smallButtonClassName}`}
                        >
                            + Add field
                        </button>
                    </div>
                )}
            </div>
            <div>
                <span className="block text-sm font-medium text-ui-300">Questions</span>
                <div className="mt-1.5 space-y-2">
                    {questions.length === 0 && <p className="text-xs text-ui-500">No questions yet.</p>}
                    {questions.map((question, i) => (
                        <QuestionEditor
                            key={question.id}
                            question={question}
                            index={i}
                            duplicateName={(nameCounts.get(question.name.trim()) ?? 0) > 1}
                            onChange={next => setQuestions(prev => prev.map(q => (q.id === next.id ? next : q)))}
                            onRemove={() => setQuestions(prev => prev.filter(q => q.id !== question.id))}
                        />
                    ))}
                </div>
                <button
                    onClick={() => setQuestions(prev => [...prev, newQuestion()])}
                    className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ui-400 transition hover:bg-ui-800 hover:text-ui-200"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add question
                </button>
            </div>
            <details>
                <summary className="cursor-pointer text-xs font-medium text-ui-400 hover:text-ui-200">Preview configuration</summary>
                <pre className="mt-1.5 max-h-72 overflow-auto rounded-lg border border-ui-700 bg-ui-800 p-3 text-xs text-ui-300">
                    {JSON.stringify(payload, null, 2)}
                </pre>
            </details>
            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={!canSave || saving}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-ui-800 bg-ui-900 px-4 py-2.5 text-sm font-medium text-ui-300 transition hover:border-ui-700 hover:bg-ui-800/60 hover:text-ui-50 disabled:pointer-events-none disabled:opacity-50"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                    </svg>
                    {saving ? 'Saving…' : initialAgent ? 'Save changes' : 'Save decision agent'}
                </button>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        disabled={saving}
                        className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-ui-400 transition hover:bg-ui-800 hover:text-ui-200 disabled:pointer-events-none disabled:opacity-50"
                    >
                        Cancel
                    </button>
                )}
                {problem && <p className="text-xs text-ui-500">{problem}</p>}
            </div>
        </div>
    )
}
