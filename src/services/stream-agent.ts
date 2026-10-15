// null means "use the provider default"
export type ModelParameters = {
    temperature: number | null
    top_k: number | null
    top_p: number | null
}

// An agent brings its own model and tools, so those are only sent when chatting with a model directly
export type StreamRequest = {
    threadId?: string | null
    prompt: string
} & (
    | { agentId: string }
    | {
        agentId?: undefined
        provider: string
        model: string
        parameters?: ModelParameters
        mcpTools?: string[]
        userVsFiles?: boolean
        userVsMemories?: boolean
        userVsSkills?: boolean
        webSearch?: boolean
    }
)

function buildRequestBody(request: StreamRequest) {
    if (request.agentId !== undefined) {
        return {
            agent_id: request.agentId,
            thread_id: request.threadId ?? null,
            prompt: request.prompt,
        }
    }

    return {
        thread_id: request.threadId ?? null,
        prompt: request.prompt,
        model: {
            provider: request.provider,
            name: request.model,
            parameters: {
                temperature: request.parameters?.temperature ?? null,
                top_p: request.parameters?.top_p ?? null,
                top_k: request.parameters?.top_k ?? null,
            },
        },
        tools: {
            mcp_ids: request.mcpTools ?? [],
            web_search: request.webSearch ?? false,
            user_vs_files: request.userVsFiles ?? false,
            user_vs_memories: request.userVsMemories ?? false,
            user_vs_skills: request.userVsSkills ?? false,
        },
    }
}

export type StreamCallbacks = {
    onChunk: (text: string) => void
    onThreadId?: (threadId: string) => void
    // A new tool call; its args may arrive incomplete and continue via onToolCallArgs
    onToolCall?: (id: string, name: string, args: string) => void
    onToolCallArgs?: (id: string, args: string) => void
    onToolResult?: (id: string | undefined, name: string, content: string, isError: boolean) => void
}

// Prefer an explicit flag from the backend; otherwise guess from the output text
function isToolError(data: Record<string, unknown>, content: string) {
    if (typeof data.is_error === "boolean") return data.is_error
    if (typeof data.status === "string") return data.status.toLowerCase() === "error"

    const text = content.trim()
    if (/^(error|exception|traceback|failed|failure)\b/i.test(text)) return true
    try {
        const json = JSON.parse(text)
        return !!json && typeof json === "object" && !Array.isArray(json) && "error" in json && !!json.error
    } catch {
        return false
    }
}

export async function streamAgent(
    request: StreamRequest,
    callbacks: StreamCallbacks,
    signal?: AbortSignal,
) {
    const applicationKey = import.meta.env.VITE_API_KEY

    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/conversation/stream`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": applicationKey,
            },
            credentials: "include",
            signal,
            body: JSON.stringify(buildRequestBody(request)),
        },
    )

    if (!response.ok) {
        throw new Error(`Stream request failed: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error("No response body")

    const decoder = new TextDecoder()
    let buffer = ""

    // Tool calls stream in chunks: only the first carries the id, the rest share its index
    const callIdsByIndex = new Map<number, string>()
    const seenCallIds = new Set<string>()

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const payload = line.slice(6)
            if (payload === "[DONE]") return

            try {
                const parsed = JSON.parse(payload)
                if (parsed.type === "message" && parsed.data) {
                    if (parsed.data.content) callbacks.onChunk(parsed.data.content)
                    const tid = parsed.data.metadata?.thread_id
                    if (tid) callbacks.onThreadId?.(tid)
                } else if (parsed.type === "tool_call" && parsed.data) {
                    const { id, name, index = 0 } = parsed.data
                    const args = typeof parsed.data.args === "string"
                        ? parsed.data.args
                        : JSON.stringify(parsed.data.args ?? "")
                    if (id && !seenCallIds.has(id)) {
                        seenCallIds.add(id)
                        callIdsByIndex.set(index, id)
                        callbacks.onToolCall?.(id, name ?? "Tool", args)
                    } else {
                        const callId = id ?? callIdsByIndex.get(index)
                        if (callId && args) callbacks.onToolCallArgs?.(callId, args)
                    }
                } else if (parsed.type === "tool_result" && parsed.data) {
                    const content = typeof parsed.data.content === "string"
                        ? parsed.data.content
                        : JSON.stringify(parsed.data.content ?? "", null, 2)
                    callbacks.onToolResult?.(
                        parsed.data.tool_call_id ?? undefined,
                        parsed.data.name ?? "Tool",
                        content,
                        isToolError(parsed.data, content),
                    )
                }
            } catch {
                // skip unparseable lines
            }
        }
    }
}
