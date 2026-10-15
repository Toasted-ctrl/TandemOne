import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppHeader } from '../components/app-header'
import { FileUploadButton } from '../components/file-upload-button'
import { SkillDetailsDialog } from '../components/skill-details-dialog'
import { SkillForm } from '../components/skill-form'
import { addSkill, type SkillPayload } from '../services/add-skill'
import { addToVectorStore } from '../services/add-to-vector-store'
import { deleteUserDocument } from '../services/delete-user-document'
import { getUserDocuments, type UserDocument } from '../services/get-user-documents'
import { getUser } from '../services/get-user'

type Tab = 'files' | 'memories' | 'skills'

type UploadEntry = {
    name: string
    kind: Tab
    status: 'uploading' | 'done' | 'error'
    error?: string
}

const TABS: Record<Tab, { label: string; singular: string; scope: string; addLabel: string }> = {
    files: { label: 'Files', singular: 'File', scope: 'user_vs_files', addLabel: 'Upload a file' },
    memories: { label: 'Memories', singular: 'Memory', scope: 'user_vs_memories', addLabel: 'Add a memory' },
    skills: { label: 'Skills', singular: 'Skill', scope: 'user_vs_skills', addLabel: 'Create a skill' },
}

// Matches Tailwind's `sm` breakpoint; the add panel starts expanded on wider screens only
const WIDE_SCREEN_QUERY = '(min-width: 640px)'

function KindIcon({ kind }: { kind: Tab }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ui-500">
            {kind === 'files' ? (
                <>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                </>
            ) : kind === 'memories' ? (
                <>
                    <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                </>
            ) : (
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            )}
        </svg>
    )
}

export function MyDocumentsPage() {
    const navigate = useNavigate()
    // The active tab lives in the URL (?tab=skills) so it survives a refresh
    const [searchParams, setSearchParams] = useSearchParams()
    const tabParam = searchParams.get('tab')
    const tab: Tab = tabParam !== null && Object.hasOwn(TABS, tabParam) ? tabParam as Tab : 'files'

    function setTab(next: Tab) {
        setSearchParams({ tab: next }, { replace: true })
    }
    const [uploads, setUploads] = useState<UploadEntry[]>([])
    const [addPanelOpen, setAddPanelOpen] = useState(() => window.matchMedia(WIDE_SCREEN_QUERY).matches)

    const [memoryName, setMemoryName] = useState('')
    const [memoryText, setMemoryText] = useState('')
    const [memorySaving, setMemorySaving] = useState(false)

    const [storedDocuments, setStoredDocuments] = useState<UserDocument[]>([])
    const [documentsLoading, setDocumentsLoading] = useState(false)
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
    const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)
    const closeSkillDetails = useCallback(() => setSelectedSkillId(null), [])

    useEffect(() => {
        getUser().catch(() => navigate('/login', { replace: true }))
    }, [navigate])

    useEffect(() => {
        setDocumentsLoading(true)
        getUserDocuments(TABS[tab].scope)
            .then(res => setStoredDocuments(res.documents))
            .catch(() => setStoredDocuments([]))
            .finally(() => setDocumentsLoading(false))
    }, [tab])

    async function handleDelete(documentId: string) {
        setDeletingIds(prev => new Set(prev).add(documentId))
        try {
            await deleteUserDocument(documentId, TABS[tab].scope)
            setStoredDocuments(prev => prev.filter(d => d.id !== documentId))
        } catch {
            // leave the item in place so the user can retry
        } finally {
            setDeletingIds(prev => {
                const next = new Set(prev)
                next.delete(documentId)
                return next
            })
        }
    }

    function refreshDocuments() {
        getUserDocuments(TABS[tab].scope)
            .then(res => setStoredDocuments(res.documents))
            .catch(() => {})
    }

    async function handleFileProcessed(file: { name: string; text: string }) {
        const entry: UploadEntry = { name: file.name, kind: 'files', status: 'uploading' }
        setUploads(prev => [entry, ...prev])

        try {
            await addToVectorStore('user_vs_files', [file.text], [{ document_name: file.name }])
            setUploads(prev =>
                prev.map(u => u === entry ? { ...u, status: 'done' } : u)
            )
            refreshDocuments()
        } catch (err) {
            setUploads(prev =>
                prev.map(u => u === entry
                    ? { ...u, status: 'error', error: err instanceof Error ? err.message : 'Upload failed' }
                    : u
                )
            )
        }
    }

    async function handleMemorySave() {
        const name = memoryName.trim()
        const text = memoryText.trim()
        if (!name || !text) return

        const entry: UploadEntry = { name, kind: 'memories', status: 'uploading' }
        setUploads(prev => [entry, ...prev])
        setMemorySaving(true)

        try {
            await addToVectorStore('user_vs_memories', [text], [{ document_name: name }])
            setUploads(prev =>
                prev.map(u => u === entry ? { ...u, status: 'done' } : u)
            )
            setMemoryName('')
            setMemoryText('')
            setAddPanelOpen(false)
            refreshDocuments()
        } catch (err) {
            setUploads(prev =>
                prev.map(u => u === entry
                    ? { ...u, status: 'error', error: err instanceof Error ? err.message : 'Save failed' }
                    : u
                )
            )
        } finally {
            setMemorySaving(false)
        }
    }

    async function handleSkillSave(skill: SkillPayload): Promise<boolean> {
        const entry: UploadEntry = { name: skill.name, kind: 'skills', status: 'uploading' }
        setUploads(prev => [entry, ...prev])

        try {
            await addSkill(TABS.skills.scope, skill)
            setUploads(prev =>
                prev.map(u => u === entry ? { ...u, status: 'done' } : u)
            )
            setAddPanelOpen(false)
            refreshDocuments()
            return true
        } catch (err) {
            setUploads(prev =>
                prev.map(u => u === entry
                    ? { ...u, status: 'error', error: err instanceof Error ? err.message : 'Save failed' }
                    : u
                )
            )
            return false
        }
    }

    const canSaveMemory = memoryName.trim().length > 0 && memoryText.trim().length > 0

    return (
        <div className="flex min-h-svh flex-col bg-ui-950 bg-grid">
            <AppHeader />
            <div className="flex-1 px-4 py-10">
                <div className="mx-auto max-w-xl">
                    <h1 className="text-2xl font-bold tracking-tight text-ui-50">My Documents</h1>
                    <p className="mt-2 text-sm text-ui-400">
                        Upload files, save memories or create skills to make them available to AI.
                    </p>

                    <div className="mt-8 flex gap-1 rounded-lg bg-ui-900 p-1 border border-ui-800">
                        {(Object.keys(TABS) as Tab[]).map(key => (
                            <button
                                key={key}
                                onClick={() => setTab(key)}
                                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                                    tab === key
                                        ? 'bg-ui-800 text-ui-50'
                                        : 'text-ui-400 hover:text-ui-200'
                                }`}
                            >
                                {TABS[key].label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 rounded-xl border border-ui-800 bg-ui-900">
                        <button
                            onClick={() => setAddPanelOpen(open => !open)}
                            aria-expanded={addPanelOpen}
                            aria-controls="add-panel"
                            className="flex w-full cursor-pointer items-center justify-between gap-3 px-6 py-4 text-sm font-medium text-ui-300 transition hover:text-ui-50"
                        >
                            <span className="flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ui-500">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                {TABS[tab].addLabel}
                            </span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-ui-500 transition-transform duration-200 ${addPanelOpen ? 'rotate-180' : ''}`}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                        {/* Hidden rather than unmounted so in-progress input survives collapsing */}
                        <div id="add-panel" className={`border-t border-ui-800/60 px-6 pb-6 pt-4 ${addPanelOpen ? '' : 'hidden'}`}>
                            {tab === 'files' ? (
                                <div>
                                    <p className="mb-4 text-sm text-ui-400">
                                        Upload a document file to index its contents.
                                    </p>
                                    <FileUploadButton
                                        target="vector-store"
                                        onFileProcessed={handleFileProcessed}
                                    />
                                </div>
                            ) : tab === 'skills' ? (
                                <SkillForm onSave={handleSkillSave} />
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="memory-name" className="block text-sm font-medium text-ui-300">
                                            Document name
                                        </label>
                                        <input
                                            id="memory-name"
                                            type="text"
                                            value={memoryName}
                                            onChange={e => setMemoryName(e.target.value)}
                                            placeholder="e.g. Project guidelines"
                                            className="mt-1.5 w-full rounded-lg border border-ui-700 bg-ui-800 px-3 py-2 text-sm text-ui-50 placeholder-ui-500 outline-none focus:border-ui-500 focus:ring-1 focus:ring-ui-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="memory-text" className="block text-sm font-medium text-ui-300">
                                            Content
                                        </label>
                                        <textarea
                                            id="memory-text"
                                            value={memoryText}
                                            onChange={e => setMemoryText(e.target.value)}
                                            placeholder="Type the memory content here…"
                                            rows={6}
                                            className="mt-1.5 w-full rounded-lg border border-ui-700 bg-ui-800 px-3 py-2 text-sm text-ui-50 placeholder-ui-500 outline-none focus:border-ui-500 focus:ring-1 focus:ring-ui-500 resize-y"
                                        />
                                    </div>
                                    <button
                                        onClick={handleMemorySave}
                                        disabled={!canSaveMemory || memorySaving}
                                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-ui-800 bg-ui-900 px-4 py-2.5 text-sm font-medium text-ui-300 transition hover:border-ui-700 hover:bg-ui-800/60 hover:text-ui-50 disabled:pointer-events-none disabled:opacity-50"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                            <polyline points="17 21 17 13 7 13 7 21" />
                                            <polyline points="7 3 7 8 15 8" />
                                        </svg>
                                        {memorySaving ? 'Saving…' : 'Save memory'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 space-y-2">
                        <h2 className="text-sm font-medium text-ui-400">
                            Stored {TABS[tab].label.toLowerCase()}
                        </h2>
                        {documentsLoading ? (
                            <p className="text-xs text-ui-500">Loading…</p>
                        ) : storedDocuments.length === 0 ? (
                            <p className="text-xs text-ui-500">
                                No {TABS[tab].label.toLowerCase()} stored yet.
                            </p>
                        ) : (
                            storedDocuments.map(doc => (
                                <div
                                    key={doc.id}
                                    className="flex items-center gap-3 rounded-lg border border-ui-800 bg-ui-900 px-4 py-3"
                                >
                                    {tab === 'skills' ? (
                                        <button
                                            onClick={() => setSelectedSkillId(doc.id)}
                                            className="group flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                                        >
                                            <KindIcon kind={tab} />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm text-ui-50 group-hover:text-brand-300">{doc.name}</p>
                                                <p className="truncate text-xs text-ui-600">{doc.id.slice(0, 18)}</p>
                                            </div>
                                        </button>
                                    ) : (
                                        <>
                                            <KindIcon kind={tab} />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm text-ui-50">{doc.name}</p>
                                                <p className="truncate text-xs text-ui-600">{doc.id.slice(0, 18)}</p>
                                            </div>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        disabled={deletingIds.has(doc.id)}
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

                    {uploads.length > 0 && (
                        <div className="mt-6 space-y-2">
                            <h2 className="text-sm font-medium text-ui-400">Recent</h2>
                            {uploads.map((upload, i) => (
                                <div
                                    key={`${upload.name}-${i}`}
                                    className="flex items-center justify-between rounded-lg border border-ui-800 bg-ui-900 px-4 py-3"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <KindIcon kind={upload.kind} />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm text-ui-50">{upload.name}</p>
                                            <p className="text-xs text-ui-500">
                                                {TABS[upload.kind].singular}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`shrink-0 text-xs font-medium ${
                                        upload.status === 'done' ? 'text-emerald-400' :
                                        upload.status === 'error' ? 'text-red-400' :
                                        'text-brand-400'
                                    }`}>
                                        {upload.status === 'done' ? 'Done' :
                                         upload.status === 'error' ? upload.error ?? 'Failed' :
                                         'Uploading…'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedSkillId && (
                <SkillDetailsDialog
                    key={selectedSkillId}
                    skillId={selectedSkillId}
                    scope={TABS.skills.scope}
                    onClose={closeSkillDetails}
                />
            )}
        </div>
    )
}
