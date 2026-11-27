import { useId, useState } from 'react'
import type { McpPayload, McpTransport } from '../services/create-admin-mcp'

type McpFormProps = {
    onSave: (mcp: McpPayload) => Promise<boolean>
}

const TRANSPORTS: { value: McpTransport; label: string }[] = [
    { value: 'streamable_http', label: 'Streamable HTTP' },
]

const inputClassName = 'mt-1.5 w-full rounded-lg border border-ui-700 bg-ui-800 px-3 py-2 text-sm text-ui-50 placeholder-ui-500 outline-none focus:border-ui-500 focus:ring-1 focus:ring-ui-500'

function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
        return false
    }
}

// Streamable HTTP servers must be added by their base URL, without the /mcp path
function endsWithMcpPath(value: string): boolean {
    try {
        return /\/mcp\/?$/i.test(new URL(value).pathname)
    } catch {
        return false
    }
}

export function McpForm({ onSave }: McpFormProps) {
    const idPrefix = useId()
    const [name, setName] = useState('')
    const [transport, setTransport] = useState<McpTransport>('streamable_http')
    const [url, setUrl] = useState('')
    const [saving, setSaving] = useState(false)

    const trimmedUrl = url.trim()
    const urlInvalid = trimmedUrl.length > 0 && !isHttpUrl(trimmedUrl)
    const urlHasMcpPath = transport === 'streamable_http' && !urlInvalid && endsWithMcpPath(trimmedUrl)
    const canSave = name.trim().length > 0 && trimmedUrl.length > 0 && !urlInvalid && !urlHasMcpPath

    async function handleSave() {
        if (!canSave) return

        setSaving(true)
        const saved = await onSave({ name: name.trim(), transport, url: trimmedUrl })
        setSaving(false)

        if (saved) {
            setName('')
            setTransport('streamable_http')
            setUrl('')
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
                    placeholder="e.g. GitHub"
                    className={inputClassName}
                />
            </div>
            <div>
                <label htmlFor={`${idPrefix}-transport`} className="block text-sm font-medium text-ui-300">
                    Transport
                </label>
                <select
                    id={`${idPrefix}-transport`}
                    value={transport}
                    onChange={e => setTransport(e.target.value as McpTransport)}
                    className={`${inputClassName} cursor-pointer`}
                >
                    {TRANSPORTS.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor={`${idPrefix}-url`} className="block text-sm font-medium text-ui-300">
                    URL
                </label>
                <input
                    id={`${idPrefix}-url`}
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    aria-invalid={urlInvalid || urlHasMcpPath}
                    className={inputClassName}
                />
                {urlInvalid && <p className="mt-1.5 text-xs text-red-400">Enter a valid http(s) URL.</p>}
                {transport === 'streamable_http' && (
                    <p className={`mt-1.5 flex items-start gap-1.5 text-xs ${urlHasMcpPath ? 'text-red-400' : 'text-amber-400'}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-px shrink-0">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span>
                            {urlHasMcpPath ? 'Remove ' : 'Enter the URL without '}
                            <code className="font-mono">/mcp</code> {urlHasMcpPath ? 'from the end of the URL' : 'at the end'}, e.g. <code className="font-mono">https://example.com</code>.
                        </span>
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2">
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
                    {saving ? 'Saving…' : 'Save MCP'}
                </button>
            </div>
        </div>
    )
}
