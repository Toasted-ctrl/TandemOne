import { useState } from 'react'
import { SKILL_DESCRIPTION_MAX_LENGTH, type SkillPayload } from '../services/add-skill'

const JSON_SCHEMA_TYPES = ['string', 'number', 'integer', 'boolean', 'object', 'array', 'null']

type SkillFormProps = {
    onSave: (skill: SkillPayload) => Promise<boolean>
}

const inputClassName = 'mt-1.5 w-full rounded-lg border border-ui-700 bg-ui-800 px-3 py-2 text-sm text-ui-50 placeholder-ui-500 outline-none focus:border-ui-500 focus:ring-1 focus:ring-ui-500'

// Returns the parsed schema, or an error message. Empty input yields an empty schema.
function parseParametersSchema(raw: string): { schema: Record<string, unknown> } | { error: string } {
    if (!raw.trim()) return { schema: {} }

    let parsed: unknown
    try {
        parsed = JSON.parse(raw)
    } catch {
        return { error: 'Parameters must be valid JSON' }
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { error: 'Parameters must be a JSON schema object' }
    }

    const schema = parsed as Record<string, unknown>
    if ('type' in schema) {
        const types = Array.isArray(schema.type) ? schema.type : [schema.type]
        if (types.length === 0 || !types.every(t => typeof t === 'string' && JSON_SCHEMA_TYPES.includes(t))) {
            return { error: `"type" must be one of: ${JSON_SCHEMA_TYPES.join(', ')}` }
        }
    }
    if ('properties' in schema) {
        const props = schema.properties
        if (typeof props !== 'object' || props === null || Array.isArray(props)) {
            return { error: '"properties" must be an object' }
        }
    }
    if ('required' in schema) {
        const required = schema.required
        if (!Array.isArray(required) || !required.every(r => typeof r === 'string')) {
            return { error: '"required" must be an array of strings' }
        }
    }

    return { schema }
}

export function SkillForm({ onSave }: SkillFormProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [skillText, setSkillText] = useState('')
    const [parametersText, setParametersText] = useState('')
    const [saving, setSaving] = useState(false)

    const parameters = parseParametersSchema(parametersText)
    const parametersError = 'error' in parameters ? parameters.error : null
    const descriptionTooLong = description.length > SKILL_DESCRIPTION_MAX_LENGTH

    const canSave =
        name.trim().length > 0 &&
        description.trim().length > 0 &&
        skillText.trim().length > 0 &&
        !descriptionTooLong &&
        !parametersError

    async function handleSave() {
        if (!canSave || 'error' in parameters) return

        setSaving(true)
        const saved = await onSave({
            name: name.trim(),
            description: description.trim(),
            skill_text: skillText.trim(),
            parameters_schema: parameters.schema,
        })
        setSaving(false)

        if (saved) {
            setName('')
            setDescription('')
            setSkillText('')
            setParametersText('')
        }
    }

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="skill-name" className="block text-sm font-medium text-ui-300">
                    Name
                </label>
                <input
                    id="skill-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Summarise meeting notes"
                    className={inputClassName}
                />
            </div>
            <div>
                <div className="flex items-baseline justify-between">
                    <label htmlFor="skill-description" className="block text-sm font-medium text-ui-300">
                        Description
                    </label>
                    <span className={`text-xs ${descriptionTooLong ? 'text-red-400' : 'text-ui-500'}`}>
                        {description.length}/{SKILL_DESCRIPTION_MAX_LENGTH}
                    </span>
                </div>
                <textarea
                    id="skill-description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe when the AI should use this skill…"
                    rows={3}
                    className={`${inputClassName} resize-y`}
                />
            </div>
            <div>
                <label htmlFor="skill-text" className="block text-sm font-medium text-ui-300">
                    Instructions
                </label>
                <textarea
                    id="skill-text"
                    value={skillText}
                    onChange={e => setSkillText(e.target.value)}
                    placeholder="Write the skill instructions here…"
                    rows={8}
                    className={`${inputClassName} resize-y`}
                />
            </div>
            <div>
                <label htmlFor="skill-parameters" className="block text-sm font-medium text-ui-300">
                    Parameters schema <span className="font-normal text-ui-500">(optional)</span>
                </label>
                <textarea
                    id="skill-parameters"
                    value={parametersText}
                    onChange={e => setParametersText(e.target.value)}
                    placeholder={'{\n  "type": "object",\n  "properties": {}\n}'}
                    rows={5}
                    spellCheck={false}
                    className={`${inputClassName} resize-y font-mono ${parametersError ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {parametersError && (
                    <p className="mt-1 text-xs text-red-400">{parametersError}</p>
                )}
            </div>
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
                {saving ? 'Saving…' : 'Save skill'}
            </button>
        </div>
    )
}
