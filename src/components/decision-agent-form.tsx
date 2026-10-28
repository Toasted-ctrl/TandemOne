import { useId, useState } from 'react'
import { ChatModelSelector } from './chat-model-selector'
import type { ProvidersOffering } from '../services/get-models'
import type { ProviderConfiguration } from '../services/get-provider-configuration'

type DecisionAgentFormProps = {
    offerings: ProvidersOffering | null
    providerConfigs: ProviderConfiguration[]
}

type QuestionType = 'choice' | 'score' | 'noul'

// The shape a decision model expects for each entry under `questions`
export type DecisionQuestion =
    | { type: 'choice'; instructions: string; criteria: Record<string, string> }
    | { type: 'score'; instructions: string; criteria: string[] }
    | { type: 'noul'; instructions: string }

type ChoiceDraft = { id: number; key: string; description: string }
type LevelDraft = { id: number; label: string }

// Choices and levels are kept separately so switching type doesn't discard input
type QuestionDraft = {
    id: number
    name: string
    type: QuestionType
    instructions: string
    choices: ChoiceDraft[]
    levels: LevelDraft[]
}

const QUESTION_TYPES: Record<QuestionType, { label: string; hint: string }> = {
    choice: { label: 'Choice', hint: 'Pick one of a set of named options.' },
    score: { label: 'Score', hint: 'Place the answer on an ordered scale, lowest first.' },
    noul: { label: 'Noul', hint: 'Answer with no criteria needed.' },
}

type StateType = 'text' | 'fields'

// Tells callers what to send as `state`: a single string, or an object with these keys
export type DecisionStateSpec =
    | { type: 'text'; description: string }
    | { type: 'fields'; fields: Record<string, string> }

type StateFieldDraft = { id: number; key: string; description: string }

const STATE_TYPES: Record<StateType, { label: string; hint: string }> = {
    text: { label: 'Text', hint: 'Callers send state as a single string.' },
    fields: { label: 'Fields', hint: 'Callers send state as an object with these keys.' },
}

const inputClassName ='mt-1.5 w-full rounded-lg border border-ui-700 bg-ui-800 px-3 py-2 text-sm text-ui-50 placeholder-ui-500 outline-none focus:border-ui-500 focus:ring-1 focus:ring-ui-500'
const rowInputClassName = 'min-w-0 flex-1 rounded-lg border border-ui-700 bg-ui-800 px-3 py-1.5 text-sm text-ui-50 placeholder-ui-500 outline-none focus:border-ui-500 focus:ring-1 focus:ring-ui-500'
const smallButtonClassName = 'cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium text-ui-400 transition hover:bg-ui-800 hover:text-ui-200'

let nextDraftId = 0

function newQuestion(): QuestionDraft {
    return {
        id: nextDraftId++,
        name: '',
        type: 'choice',
        instructions: '',
        choices: [{ id: nextDraftId++, key: '', description: '' }],
        levels: [{ id: nextDraftId++, label: '' }],
    }
}

// Converts drafts into the `questions` object, skipping unnamed questions and blank criteria rows
function buildDecisionQuestions(drafts: QuestionDraft[]): Record<string, DecisionQuestion> {
    const questions: Record<string, DecisionQuestion> = {}
    for (const draft of drafts) {
        const name = draft.name.trim()
        if (!name) continue
        const instructions = draft.instructions.trim()

        if (draft.type === 'choice') {
            const criteria: Record<string, string> = {}
            for (const choice of draft.choices) {
                if (choice.key.trim()) criteria[choice.key.trim()] = choice.description.trim()
            }
            questions[name] = { type: 'choice', instructions, criteria }
        } else if (draft.type === 'score') {
            const criteria = draft.levels.map(l => l.label.trim()).filter(Boolean)
            questions[name] = { type: 'score', instructions, criteria }
        } else {
            questions[name] = { type: 'noul', instructions }
        }
    }
    return questions
}

function buildStateSpec(type: StateType, description: string, fields: StateFieldDraft[]): DecisionStateSpec {
    if (type === 'text') return { type: 'text', description: description.trim() }

    const spec: Record<string, string> = {}
    for (const field of fields) {
        if (field.key.trim()) spec[field.key.trim()] = field.description.trim()
    }
    return { type: 'fields', fields: spec }
}

// Shows callers what a matching `state` value looks like
function buildStateExample(spec: DecisionStateSpec): string | Record<string, string> {
    if (spec.type === 'text') return spec.description ? `<${spec.description}>` : '<text>'
    return Object.fromEntries(Object.entries(spec.fields).map(([key, description]) => [key, `<${description || key}>`]))
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

    function updateChoice(id: number, patch: Partial<ChoiceDraft>) {
        update({ choices: question.choices.map(c => (c.id === id ? { ...c, ...patch } : c)) })
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
                        {question.choices.map((choice, i) => (
                            <div key={choice.id} className="flex items-center gap-1.5">
                                <input
                                    type="text"
                                    value={choice.key}
                                    onChange={e => updateChoice(choice.id, { key: e.target.value })}
                                    placeholder="e.g. refund"
                                    aria-label={`Option ${i + 1} key`}
                                    className={`${rowInputClassName} max-w-40`}
                                />
                                <input
                                    type="text"
                                    value={choice.description}
                                    onChange={e => updateChoice(choice.id, { description: e.target.value })}
                                    placeholder="e.g. Refund in full"
                                    aria-label={`Option ${i + 1} description`}
                                    className={rowInputClassName}
                                />
                                <RemoveButton
                                    label={`Remove option ${i + 1}`}
                                    onClick={() => update({ choices: question.choices.filter(c => c.id !== choice.id) })}
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => update({ choices: [...question.choices, { id: nextDraftId++, key: '', description: '' }] })}
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
                                <span className="w-5 shrink-0 text-right text-xs text-ui-500">{i + 1}.</span>
                                <input
                                    type="text"
                                    value={level.label}
                                    onChange={e => updateLevel(level.id, e.target.value)}
                                    placeholder="e.g. routine"
                                    aria-label={`Level ${i + 1}`}
                                    className={rowInputClassName}
                                />
                                <RemoveButton
                                    label={`Remove level ${i + 1}`}
                                    onClick={() => update({ levels: question.levels.filter(l => l.id !== level.id) })}
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => update({ levels: [...question.levels, { id: nextDraftId++, label: '' }] })}
                        className={`mt-1.5 ${smallButtonClassName}`}
                    >
                        + Add level
                    </button>
                </div>
            )}
        </div>
    )
}

export function DecisionAgentForm({ offerings, providerConfigs }: DecisionAgentFormProps) {
    // The create and edit forms may later be in the DOM together, so ids must be unique
    const idPrefix = useId()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [provider, setProvider] = useState('')
    const [model, setModel] = useState('')
    const [stateType, setStateType] = useState<StateType>('text')
    const [stateDescription, setStateDescription] = useState('')
    const [stateFields, setStateFields] = useState<StateFieldDraft[]>(() => [{ id: nextDraftId++, key: '', description: '' }])
    const [questions, setQuestions] = useState<QuestionDraft[]>(() => [newQuestion()])

    const stateSpec = buildStateSpec(stateType, stateDescription, stateFields)

    function updateStateField(id: number, patch: Partial<StateFieldDraft>) {
        setStateFields(prev => prev.map(f => (f.id === id ? { ...f, ...patch } : f)))
    }

    // Names are keys in the `questions` object, so they must be unique
    const nameCounts = new Map<string, number>()
    for (const q of questions) {
        const name = q.name.trim()
        if (name) nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1)
    }

    const [saveNotice, setSaveNotice] = useState(false)

    const canSave =
        name.trim().length > 0 &&
        !!provider &&
        !!model &&
        nameCounts.size > 0 &&
        [...nameCounts.values()].every(count => count === 1)

    // TODO: Send the decision agent to the backend once the endpoint exists
    function handleSave() {
        if (!canSave) return
        setSaveNotice(true)
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
                {stateType === 'text' ? (
                    <textarea
                        value={stateDescription}
                        onChange={e => setStateDescription(e.target.value)}
                        placeholder="e.g. The support ticket text, including when the order was placed and whether it has shipped."
                        aria-label="State description"
                        rows={2}
                        className={`${inputClassName} resize-y`}
                    />
                ) : (
                    <div className="mt-1.5">
                        <div className="space-y-1.5">
                            {stateFields.map((field, i) => (
                                <div key={field.id} className="flex items-center gap-1.5">
                                    <input
                                        type="text"
                                        value={field.key}
                                        onChange={e => updateStateField(field.id, { key: e.target.value })}
                                        placeholder="e.g. expectations"
                                        aria-label={`Field ${i + 1} key`}
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
                            onClick={() => setStateFields(prev => [...prev, { id: nextDraftId++, key: '', description: '' }])}
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
                <summary className="cursor-pointer text-xs font-medium text-ui-400 hover:text-ui-200">Preview example request</summary>
                <pre className="mt-1.5 max-h-72 overflow-auto rounded-lg border border-ui-700 bg-ui-800 p-3 text-xs text-ui-300">
                    {JSON.stringify({ state: buildStateExample(stateSpec), questions: buildDecisionQuestions(questions) }, null, 2)}
                </pre>
            </details>
            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={!canSave}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-ui-800 bg-ui-900 px-4 py-2.5 text-sm font-medium text-ui-300 transition hover:border-ui-700 hover:bg-ui-800/60 hover:text-ui-50 disabled:pointer-events-none disabled:opacity-50"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Save decision agent
                </button>
                {saveNotice && (
                    <p className="text-xs text-amber-400">Saving decision agents isn't available yet, so nothing was saved.</p>
                )}
            </div>
        </div>
    )
}
