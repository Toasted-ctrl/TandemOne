import { useRef, useState } from 'react'
import { extractFileText } from '../services/extract-file-text'

export type UploadTarget = 'vector-store' | 'context'

type FileUploadButtonProps = {
    target: UploadTarget
    onFileProcessed: (file: { name: string; text: string }) => void
    disabled?: boolean
}

const ACCEPTED_TYPES = '.pdf,.docx,.txt,.md,.csv'

export function FileUploadButton({ target: _target, onFileProcessed, disabled }: FileUploadButtonProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setProcessing(true)
        setError(null)

        try {
            const text = await extractFileText(file)
            onFileProcessed({ name: file.name, text })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process file')
        } finally {
            setProcessing(false)
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    return (
        <div>
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handleChange}
                className="hidden"
            />
            <button
                onClick={() => inputRef.current?.click()}
                disabled={disabled || processing}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-ui-800 bg-ui-900 px-4 py-2.5 text-sm font-medium text-ui-300 transition hover:border-ui-700 hover:bg-ui-800/60 hover:text-ui-50 disabled:pointer-events-none disabled:opacity-50"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {processing ? 'Processing…' : 'Upload file'}
            </button>
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>
    )
}
