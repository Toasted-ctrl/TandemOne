import { useEffect, useState } from 'react'
import { ChatModelSelector } from './chat-model-selector'
import { SamplingSelector } from './sampling-selector'
import { ToolSelector } from './tool-selector'
import { WebSearchToggle } from './web-search-toggle'
import type { AgentPayload } from '../services/get-playground-agent'
import type { Mcp } from '../services/get-mcps'
import type { ProvidersOffering } from '../services/get-models'
import type { ProviderConfiguration } from '../services/get-provider-configuration'
import { getModelSampling, type ModelSamplingSupport } from '../services/get-model-sampling'
import type { ModelParameters } from '../services/stream-agent'

type AgentFormProps = {
    offerings: ProvidersOffering | null
    providerConfigs: ProviderConfiguration[]
    mcps: Mcp[]
    onSave: (agent: AgentPayload) => Promise<boolean>
}

const inputClassName = 'mt-1.5 w-full rounded-lg border border-ui-700 bg-ui-800 px-3 py-2 text-sm text-ui-50 placeholder-ui-500 outline-none focus:border-ui-500 focus:ring-1 focus:ring-ui-500'

const DEFAULT_PARAMETERS: ModelParameters = { temperature: null, top_p: null, top_k: null }

export function AgentForm({ offerings, providerConfigs, mcps, onSave }: AgentFormProps) {
    const [name, setName] = useState('')
    const [systemPrompt, setSystemPrompt] = useState('')
    const [provider, setProvider] = useState('')
    const [model, setModel] = useState('')
    const [parameters, setParameters] = useState<ModelParameters>(DEFAULT_PARAMETERS)
    const [samplingSupport, setSamplingSupport] = useState<ModelSamplingSupport | null>(null)
    const [selectedMcps, setSelectedMcps] = useState<string[]>([])
    const [userVsFiles, setUserVsFiles] = useState(false)
    const [userVsMemories, setUserVsMemories] = useState(false)
    const [userVsSkills, setUserVsSkills] = useState(false)
    const [webSearch, setWebSearch] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!provider || !model) return

        let cancelled = false
        getModelSampling(provider, model)
            .then(res => {
                if (cancelled) return
                setSamplingSupport(res.sampling)
                // Drop values the new model can't accept so they aren't saved with the agent
                setParameters(prev => ({
                    temperature: res.sampling.temperature ? prev.temperature : null,
                    top_p: res.sampling.top_p ? prev.top_p : null,
                    top_k: res.sampling.top_k ? prev.top_k : null,
                }))
            })
            .catch(console.error)
        return () => { cancelled = true }
    }, [provider, model])

    const canSave =
        name.trim().length > 0 &&
        systemPrompt.trim().length > 0 &&
        !!provider &&
        !!model

    async function handleSave() {
        if (!canSave) return

        const mcpIds = selectedMcps
            .map(mcpName => mcps.find(m => m.name === mcpName)?.id)
            .filter((id): id is string => !!id)

        setSaving(true)
        const saved = await onSave({
            name: name.trim(),
            system_prompt: systemPrompt.trim(),
            model: { provider, name: model, parameters },
            tools: {
                mcp_ids: mcpIds,
                web_search: webSearch,
                user_vs_files: userVsFiles,
                user_vs_memories: userVsMemories,
                user_vs_skills: userVsSkills,
            },
        })
        setSaving(false)

        if (saved) {
            setName('')
            setSystemPrompt('')
            setProvider('')
            setModel('')
            setSamplingSupport(null)
            setParameters(DEFAULT_PARAMETERS)
            setSelectedMcps([])
            setUserVsFiles(false)
            setUserVsMemories(false)
            setUserVsSkills(false)
            setWebSearch(false)
        }
    }

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="agent-name" className="block text-sm font-medium text-ui-300">
                    Name
                </label>
                <input
                    id="agent-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Research assistant"
                    className={inputClassName}
                />
            </div>
            <div>
                <span className="block text-sm font-medium text-ui-300">Model and tools</span>
                <div className="mt-1.5 flex flex-wrap items-center gap-1 rounded-lg border border-ui-700 bg-ui-800 p-1">
                    {offerings ? (
                        <ChatModelSelector
                            offerings={offerings}
                            providerConfigs={providerConfigs}
                            selectedProvider={provider}
                            selectedModel={model}
                            onSelect={(p, m) => {
                                // Unknown until the new model's sampling support loads
                                setSamplingSupport(null)
                                setProvider(p)
                                setModel(m)
                            }}
                            placement="down"
                        />
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-ui-500">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500/60" />
                            Loading models...
                        </div>
                    )}
                    <ToolSelector
                        mcps={mcps}
                        selectedMcps={selectedMcps}
                        onMcpToggle={mcpName =>
                            setSelectedMcps(prev =>
                                prev.includes(mcpName) ? prev.filter(n => n !== mcpName) : [...prev, mcpName]
                            )
                        }
                        userVsFiles={userVsFiles}
                        onUserVsFilesToggle={() => setUserVsFiles(v => !v)}
                        userVsMemories={userVsMemories}
                        onUserVsMemoriesToggle={() => setUserVsMemories(v => !v)}
                        userVsSkills={userVsSkills}
                        onUserVsSkillsToggle={() => setUserVsSkills(v => !v)}
                        placement="down"
                    />
                    <WebSearchToggle enabled={webSearch} onToggle={() => setWebSearch(v => !v)} />
                    <div className="ml-auto">
                        <SamplingSelector
                            parameters={parameters}
                            onChange={setParameters}
                            supported={samplingSupport}
                            placement="down"
                        />
                    </div>
                </div>
            </div>
            <div>
                <label htmlFor="agent-system-prompt" className="block text-sm font-medium text-ui-300">
                    System prompt
                </label>
                <textarea
                    id="agent-system-prompt"
                    value={systemPrompt}
                    onChange={e => setSystemPrompt(e.target.value)}
                    placeholder="Describe how the agent should behave…"
                    rows={8}
                    className={`${inputClassName} resize-y`}
                />
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
                {saving ? 'Saving…' : 'Save agent'}
            </button>
        </div>
    )
}
