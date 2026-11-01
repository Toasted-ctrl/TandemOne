import { decisionAgentError } from './get-decision-agent'

export type AgentSharedUsers = {
    users: string[]
}

// Requester must be the owner of the agent
export async function getAgentSharedUsers(agentId: string): Promise<AgentSharedUsers> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const params = new URLSearchParams({ agent_id: agentId })
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/share/agent?${params}`, {
            headers: {
                'X-API-Key': applicationKey
            },
            credentials: 'include'
        }
    )

    if (!response.ok) {
        throw await decisionAgentError(response, 'Failed to fetch shared users')
    }

    return response.json()
}
