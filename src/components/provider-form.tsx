import { useId, useState } from 'react'
import type { AdminProviderPayload } from '../services/add-admin-provider'
import { LANGCHAIN_CONNECTIONS, type LangChainCon } from '../services/get-admin-providers'

type ProviderFormProps = {
    onSave: (provider: AdminProviderPayload) => Promise<boolean>
}

// Match the API's max lengths
const NAME_MAX_LENGTH = 50
const BASE_URL_MAX_LENGTH = 100
const MAC_ADDRESS_MAX_LENGTH = 30

const inputClassName = 'mt-1.5 w-full rounded-lg border border-ui-700 bg-ui-800 px-3 py-2 text-sm text-ui-50 placeholder-ui-500 outline-none focus:border-ui-500 focus:ring-1 focus:ring-ui-500'

function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
        return false
    }
}

// Same look as the tabs on the Models page
function SegmentedControl({ labelId, value, options, onChange }: {
    labelId: string
    value: boolean
    options: [{ label: string; value: boolean }, { label: string; value: boolean }]
    onChange: (value: boolean) => void
}) {
    return (
        <div role="radiogroup" aria-labelledby={labelId} className="mt-1.5 flex gap-1 rounded-lg border border-ui-700 bg-ui-800 p-1">
            {options.map(option => (
                <button
                    key={option.label}
                    type="button"
                    role="radio"
                    aria-checked={value === option.value}
                    onClick={() => onChange(option.value)}
                    className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition ${
                        value === option.value
                            ? 'bg-ui-700 text-ui-50'
                            : 'text-ui-400 hover:text-ui-200'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}

export function ProviderForm({ onSave }: ProviderFormProps) {
    const idPrefix = useId()
    const [name, setName] = useState('')
    const [baseUrl, setBaseUrl] = useState('')
    const [langchainCon, setLangchainCon] = useState<LangChainCon>('ChatOpenAI')
    const [internal, setInternal] = useState(false)
    const [requiresApiKey, setRequiresApiKey] = useState(true)
    const [macAddress, setMacAddress] = useState('')
    const [saving, setSaving] = useState(false)

    const trimmedName = name.trim()
    const trimmedUrl = baseUrl.trim()
    const urlInvalid = trimmedUrl.length > 0 && !isHttpUrl(trimmedUrl)
    const canSave = trimmedName.length > 0 && trimmedUrl.length > 0 && !urlInvalid

    async function handleSave() {
        if (!canSave) return

        setSaving(true)
        const saved = await onSave({
            name: trimmedName,
            base_url: trimmedUrl,
            internal,
            requires_api_key: requiresApiKey,
            langchain_con: langchainCon,
            mac_address: macAddress.trim() || null,
        })
        setSaving(false)

        if (saved) {
            setName('')
            setBaseUrl('')
            setLangchainCon('ChatOpenAI')
            setInternal(false)
            setRequiresApiKey(true)
            setMacAddress('')
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
                    maxLength={NAME_MAX_LENGTH}
                    placeholder="e.g. OpenRouter"
                    autoComplete="off"
                    className={inputClassName}
                />
            </div>
            <div>
                <label htmlFor={`${idPrefix}-url`} className="block text-sm font-medium text-ui-300">
                    Base URL
                </label>
                <input
                    id={`${idPrefix}-url`}
                    type="url"
                    value={baseUrl}
                    onChange={e => setBaseUrl(e.target.value)}
                    maxLength={BASE_URL_MAX_LENGTH}
                    placeholder="https://openrouter.ai/api/v1"
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={urlInvalid}
                    className={inputClassName}
                />
                {urlInvalid && <p className="mt-1.5 text-xs text-red-400">Enter a valid http(s) URL.</p>}
            </div>
            <div>
                <label htmlFor={`${idPrefix}-connection`} className="block text-sm font-medium text-ui-300">
                    Connection type
                </label>
                <select
                    id={`${idPrefix}-connection`}
                    value={langchainCon}
                    onChange={e => setLangchainCon(e.target.value as LangChainCon)}
                    className={`${inputClassName} cursor-pointer`}
                >
                    {LANGCHAIN_CONNECTIONS.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                </select>
                <p className="mt-1.5 text-xs text-ui-500">The API the provider speaks. Pick OpenAI for OpenAI-compatible providers.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <span id={`${idPrefix}-internal`} className="block text-sm font-medium text-ui-300">
                        Hosting
                    </span>
                    <SegmentedControl
                        labelId={`${idPrefix}-internal`}
                        value={internal}
                        onChange={setInternal}
                        options={[{ label: 'External', value: false }, { label: 'Internal', value: true }]}
                    />
                </div>
                <div>
                    <span id={`${idPrefix}-api-key`} className="block text-sm font-medium text-ui-300">
                        API key
                    </span>
                    <SegmentedControl
                        labelId={`${idPrefix}-api-key`}
                        value={requiresApiKey}
                        onChange={setRequiresApiKey}
                        options={[{ label: 'Required', value: true }, { label: 'Not needed', value: false }]}
                    />
                </div>
            </div>
            <div>
                <label htmlFor={`${idPrefix}-mac`} className="block text-sm font-medium text-ui-300">
                    MAC address <span className="font-normal text-ui-500">(optional)</span>
                </label>
                <input
                    id={`${idPrefix}-mac`}
                    type="text"
                    value={macAddress}
                    onChange={e => setMacAddress(e.target.value)}
                    maxLength={MAC_ADDRESS_MAX_LENGTH}
                    placeholder="e.g. 00:1A:2B:3C:4D:5E"
                    autoComplete="off"
                    spellCheck={false}
                    className={`${inputClassName} font-mono`}
                />
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
                    {saving ? 'Saving…' : 'Save provider'}
                </button>
            </div>
        </div>
    )
}
