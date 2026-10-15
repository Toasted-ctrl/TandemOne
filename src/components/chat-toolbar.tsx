import { ChatModeToggle, type ChatMode } from "./chat-mode-toggle"
import { ToolSelector } from "./tool-selector"
import { WebSearchToggle } from "./web-search-toggle"
import { SamplingSelector } from "./sampling-selector"
import type { Mcp } from "../services/get-mcps"
import type { ModelParameters } from "../services/stream-agent"
import type { ModelSamplingSupport } from "../services/get-model-sampling"

type ChatToolbarProps = {
    // In agent mode the agent's own configuration applies, so the tools are replaced by a notice
    mode: ChatMode
    onModeChange: (mode: ChatMode) => void
    agentName?: string
    mcps: Mcp[]
    selectedMcps: string[]
    onMcpToggle: (mcpName: string) => void
    userVsFiles: boolean
    onUserVsFilesToggle: () => void
    userVsMemories: boolean
    onUserVsMemoriesToggle: () => void
    userVsSkills: boolean
    onUserVsSkillsToggle: () => void
    webSearch: boolean
    onWebSearchToggle: () => void
    parameters: ModelParameters
    onParametersChange: (parameters: ModelParameters) => void
    samplingSupport: ModelSamplingSupport | null
}

export function ChatToolbar({
    mode,
    onModeChange,
    agentName,
    mcps,
    selectedMcps,
    onMcpToggle,
    userVsFiles,
    onUserVsFilesToggle,
    userVsMemories,
    onUserVsMemoriesToggle,
    userVsSkills,
    onUserVsSkillsToggle,
    webSearch,
    onWebSearchToggle,
    parameters,
    onParametersChange,
    samplingSupport,
}: ChatToolbarProps) {
    // Fixed height so switching between model and agent never shifts the layout
    return (
        <div className="mb-2.5 flex h-9 items-center gap-1">
            {mode === "agent" ? (
                <div className="flex min-w-0 items-center gap-2 px-2 text-xs text-ui-400 sm:text-sm">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand-500">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4M12 8h.01" />
                    </svg>
                    <span className="truncate">
                        {agentName ? (
                            <>Using <span className="font-semibold text-ui-100">{agentName}</span> settings</>
                        ) : (
                            "Select an agent to use its model and tools"
                        )}
                    </span>
                </div>
            ) : (
                <>
                    <ToolSelector
                        mcps={mcps}
                        selectedMcps={selectedMcps}
                        onMcpToggle={onMcpToggle}
                        userVsFiles={userVsFiles}
                        onUserVsFilesToggle={onUserVsFilesToggle}
                        userVsMemories={userVsMemories}
                        onUserVsMemoriesToggle={onUserVsMemoriesToggle}
                        userVsSkills={userVsSkills}
                        onUserVsSkillsToggle={onUserVsSkillsToggle}
                    />
                    <WebSearchToggle
                        enabled={webSearch}
                        onToggle={onWebSearchToggle}
                    />
                </>
            )}
            <div className="ml-auto flex shrink-0 items-center gap-1">
                {mode === "model" && (
                    <SamplingSelector
                        parameters={parameters}
                        onChange={onParametersChange}
                        supported={samplingSupport}
                    />
                )}
                <ChatModeToggle mode={mode} onChange={onModeChange} />
            </div>
        </div>
    )
}
