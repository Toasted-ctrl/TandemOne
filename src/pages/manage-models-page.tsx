import { useEffect, useId, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppHeader } from '../components/app-header'
import { addAdminModel } from '../services/add-admin-model'
import { deleteAdminModel } from '../services/delete-admin-model'
import { getAdminModels, type ManagedExpertise } from '../services/get-admin-models'
import { getUser, isAdmin } from '../services/get-user'
import { modelDisplayName } from '../utils/model-display-name'

// Matches the API's max length for a model name
const MODEL_NAME_MAX_LENGTH = 255

const EXPERTISES: { value: ManagedExpertise; label: string; description: string }[] = [
    { value: 'chat_completion', label: 'Chat completion', description: 'Models available for chat and chat agents.' },
    { value: 'system_one', label: 'System One', description: 'Models available for decision agents.' },
]

// Sorted by the short name shown in the list, so the order matches what the admin reads.
// Numeric so "glm-5.10" comes after "glm-5.3"; the full name breaks ties between providers.
function compareModels(a: string, b: string): number {
    const options = { numeric: true, sensitivity: 'base' } as const
    return modelDisplayName(a).localeCompare(modelDisplayName(b), undefined, options)
        || a.localeCompare(b, undefined, options)
}

type ModelsByExpertise = Record<ManagedExpertise, string[] | null>

const inputClassName = 'w-full rounded-lg border border-ui-700 bg-ui-800 px-3 py-2 text-sm text-ui-50 placeholder-ui-500 outline-none focus:border-ui-500 focus:ring-1 focus:ring-ui-500'

function ModelIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ui-500">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
            <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
        </svg>
    )
}

export function ManageModelsPage() {
    const navigate = useNavigate()
    const inputId = useId()
    const [authorized, setAuthorized] = useState(false)
    // The active expertise lives in the URL (?tab=system_one) so it survives a refresh
    const [searchParams, setSearchParams] = useSearchParams()
    const tabParam = searchParams.get('tab')
    const expertise: ManagedExpertise = EXPERTISES.find(x => x.value === tabParam)?.value ?? 'chat_completion'
    const [models, setModels] = useState<ModelsByExpertise>({ chat_completion: null, system_one: null })
    const [loadErrors, setLoadErrors] = useState<Partial<Record<ManagedExpertise, boolean>>>({})
    const [newModel, setNewModel] = useState('')
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [deletingNames, setDeletingNames] = useState<Set<string>>(new Set())
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
        for (const { value } of EXPERTISES) {
            getAdminModels(value)
                // The API returns models unordered
                .then(res => setModels(prev => ({ ...prev, [value]: [...res.models].sort(compareModels) })))
                .catch(() => {
                    setModels(prev => ({ ...prev, [value]: [] }))
                    setLoadErrors(prev => ({ ...prev, [value]: true }))
                })
        }
    }, [authorized])

    function selectExpertise(value: ManagedExpertise) {
        setSearchParams({ tab: value }, { replace: true })
        setSaveError(null)
        setDeleteError(null)
    }

    const trimmedModel = newModel.trim()
    const canSave = trimmedModel.length > 0 && !saving

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        if (!canSave) return

        // Captured so a tab switch mid-request still updates the right list
        const target = expertise
        setSaving(true)
        setSaveError(null)
        try {
            const created = await addAdminModel({ model_name: trimmedModel, expertise: target })
            setModels(prev => ({
                ...prev,
                [target]: [...(prev[target] ?? []), created.model_name].sort(compareModels),
            }))
            setNewModel('')
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Save failed')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(modelName: string) {
        if (!window.confirm(`Delete the model "${modelName}"? It will no longer be available to users or agents. This can't be undone.`)) return
        const target = expertise
        setDeleteError(null)
        setDeletingNames(prev => new Set(prev).add(modelName))
        try {
            await deleteAdminModel(modelName)
            setModels(prev => ({ ...prev, [target]: (prev[target] ?? []).filter(m => m !== modelName) }))
        } catch (err) {
            // Leave the item in place so the user can retry
            setDeleteError(err instanceof Error ? err.message : 'Delete failed')
        } finally {
            setDeletingNames(prev => {
                const next = new Set(prev)
                next.delete(modelName)
                return next
            })
        }
    }

    if (!authorized) return null

    const current = EXPERTISES.find(x => x.value === expertise)!
    const currentModels = models[expertise]

    return (
        <div className="flex min-h-svh flex-col bg-ui-950 bg-grid">
            <AppHeader />
            <div className="flex-1 px-4 py-10">
                <div className="mx-auto max-w-xl">
                    <h1 className="text-2xl font-bold tracking-tight text-ui-50">Models</h1>
                    <p className="mt-2 text-sm text-ui-400">
                        Manage which models are supported, per expertise.
                    </p>

                    <div className="mt-8 flex gap-1 rounded-lg bg-ui-900 p-1 border border-ui-800">
                        {EXPERTISES.map(x => (
                            <button
                                key={x.value}
                                onClick={() => selectExpertise(x.value)}
                                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                                    expertise === x.value
                                        ? 'bg-ui-800 text-ui-50'
                                        : 'text-ui-400 hover:text-ui-200'
                                }`}
                            >
                                {x.label}
                            </button>
                        ))}
                    </div>
                    <p className="mt-2 text-xs text-ui-500">{current.description}</p>

                    <form onSubmit={handleAdd} className="mt-4 rounded-xl border border-ui-800 bg-ui-900 px-6 py-5">
                        <label htmlFor={inputId} className="block text-sm font-medium text-ui-300">
                            Add a {current.label.toLowerCase()} model
                        </label>
                        <div className="mt-1.5 flex gap-2">
                            <input
                                id={inputId}
                                type="text"
                                value={newModel}
                                onChange={e => setNewModel(e.target.value)}
                                maxLength={MODEL_NAME_MAX_LENGTH}
                                placeholder="e.g. z-ai/glm-5.3"
                                autoComplete="off"
                                spellCheck={false}
                                className={inputClassName}
                            />
                            <button
                                type="submit"
                                disabled={!canSave}
                                className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-ui-700 bg-ui-800 px-4 py-2 text-sm font-medium text-ui-300 transition hover:border-ui-600 hover:text-ui-50 disabled:pointer-events-none disabled:opacity-50"
                            >
                                {saving ? 'Adding…' : 'Add'}
                            </button>
                        </div>
                        <p className="mt-1.5 text-xs text-ui-500">Use the model's full name exactly as its provider expects it.</p>
                        {saveError && <p className="mt-2 text-xs text-red-400">{saveError}</p>}
                    </form>

                    <div className="mt-6 space-y-2">
                        <h2 className="text-sm font-medium text-ui-400">{current.label} models</h2>
                        {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
                        {currentModels === null ? (
                            <p className="text-xs text-ui-500">Loading…</p>
                        ) : loadErrors[expertise] ? (
                            <p className="text-xs text-red-400">Failed to load models.</p>
                        ) : currentModels.length === 0 ? (
                            <p className="text-xs text-ui-500">No models have been added yet.</p>
                        ) : (
                            currentModels.map(model => {
                                const short = modelDisplayName(model)
                                return (
                                    <div
                                        key={model}
                                        className="flex items-center gap-3 rounded-lg border border-ui-800 bg-ui-900 px-4 py-3"
                                    >
                                        <ModelIcon />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm text-ui-50">{short}</p>
                                            {short !== model && (
                                                <p className="truncate font-mono text-xs text-ui-600" title={model}>{model}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(model)}
                                            disabled={deletingNames.has(model)}
                                            aria-label={`Delete ${model}`}
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
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
