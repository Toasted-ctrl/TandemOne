import type { ModelParameters } from './stream-agent'

export type AgentModel = {
    provider: string
    name: string
    parameters: ModelParameters
}

export type AgentTools = {
    mcp_ids: string[]
    web_search: boolean
    user_vs_files: boolean
    user_vs_memories: boolean
    user_vs_skills: boolean
}

export type AgentPayload = {
    name: string
    model: AgentModel
    system_prompt: string
    tools: AgentTools
}

export type Agent = AgentPayload & {
    id: string
    // Legacy agents were stored unencrypted; saving them again encrypts them
    is_encrypted: boolean
}

export async function getPlaygroundAgent(agentId: string): Promise<Agent> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const params = new URLSearchParams({ agent_id: agentId })
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/playground/agent?${params}`, {
            headers: {
                'X-API-Key': applicationKey
            },
            credentials: 'include'
        }
    )

    if (!response.ok) {
        throw new Error('Failed to fetch agent')
    }

    return response.json()
}
