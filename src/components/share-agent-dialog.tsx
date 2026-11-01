import { useEffect, useState, type FormEvent } from 'react'
import { getAgentSharedUsers } from '../services/get-agent-shared-users'
import { shareAgent } from '../services/share-agent'

type ShareAgentDialogProps = {
    agentId: string
    agentName: string
    onClose: () => void
}

const inputClassName = 'w-full rounded-lg border border-ui-700 bg-ui-800 px-3 py-2 font-mono text-sm text-ui-50 placeholder-ui-500 outline-none focus:border-ui-500 focus:ring-1 focus:ring-ui-500'

export function ShareAgentDialog({ agentId, agentName, onClose }: ShareAgentDialogProps) {
    const [users, setUsers] = useState<string[] | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)

    const [userId, setUserId] = useState('')
    const [sharing, setSharing] = useState(false)
    const [shareError, setShareError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        getAgentSharedUsers(agentId)
            .then(res => { if (!cancelled) setUsers(res.users) })
            .catch(err => { if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load shared users') })
        return () => { cancelled = true }
    }, [agentId])

    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [onClose])

    useEffect(() => {
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = previousOverflow }
    }, [])

    async function handleShare(e: FormEvent) {
        e.preventDefault()
        const shareWithUserId = userId.trim()
        if (!shareWithUserId) return
        setSharing(true)
        setShareError(null)
        try {
            await shareAgent(agentId, shareWithUserId)
            setUsers(prev => [...(prev ?? []), shareWithUserId])
            setUserId('')
        } catch (err) {
            setShareError(err instanceof Error ? err.message : 'Failed to share agent')
        } finally {
            setSharing(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="share-agent-title"
                className="relative flex max-h-[85svh] w-full max-w-lg flex-col rounded-xl border border-ui-800 bg-ui-900 shadow-xl"
            >
                <div className="flex items-start justify-between gap-4 border-b border-ui-800/60 px-6 py-4">
                    <div className="min-w-0">
                        <h2 id="share-agent-title" className="truncate text-lg font-semibold text-ui-50">
                            Share “{agentName}”
                        </h2>
                        <p className="text-xs text-ui-500">Users can find their ID under Settings → Personal.</p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="flex shrink-0 cursor-pointer items-center justify-center rounded-lg p-1.5 text-ui-400 transition hover:bg-ui-800 hover:text-ui-200"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
                    <form onSubmit={handleShare}>
                        <label htmlFor="share-agent-user-id" className="block text-sm font-medium text-ui-300">
                            User ID
                        </label>
                        <div className="mt-1.5 flex gap-2">
                            <input
                                id="share-agent-user-id"
                                type="text"
                                value={userId}
                                onChange={e => setUserId(e.target.value)}
                                placeholder="e.g. 3f2a9c1e-…"
                                autoComplete="off"
                                autoFocus
                                className={inputClassName}
                            />
                            <button
                                type="submit"
                                disabled={!userId.trim() || sharing}
                                className="shrink-0 cursor-pointer rounded-lg border border-ui-700 bg-ui-800 px-4 py-2 text-sm font-medium text-ui-300 transition hover:border-ui-600 hover:text-ui-50 disabled:pointer-events-none disabled:opacity-50"
                            >
                                {sharing ? 'Sharing…' : 'Share'}
                            </button>
                        </div>
                        {shareError && <p className="mt-2 text-xs text-red-400">{shareError}</p>}
                    </form>

                    <section className="space-y-2">
                        <h3 className="text-xs font-medium uppercase tracking-wide text-ui-500">People with access</h3>
                        {loadError ? (
                            <p className="text-sm text-red-400">{loadError}</p>
                        ) : !users ? (
                            <p className="text-sm text-ui-500">Loading…</p>
                        ) : users.length === 0 ? (
                            <p className="text-sm text-ui-500">This agent isn't shared with anyone yet.</p>
                        ) : (
                            <ul className="divide-y divide-ui-800 rounded-lg border border-ui-800">
                                {users.map(id => (
                                    <li key={id} className="break-all px-4 py-2 font-mono text-sm text-ui-300">{id}</li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </div>
    )
}
