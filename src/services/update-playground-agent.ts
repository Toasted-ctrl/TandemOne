import type { Agent, AgentPayload } from './get-playground-agent'

export async function updatePlaygroundAgent(agentId: string, agent: AgentPayload): Promise<Agent> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const params = new URLSearchParams({ agent_id: agentId })
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/playground/agent?${params}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': applicationKey
            },
            credentials: 'include',
            body: JSON.stringify(agent)
        }
    )

    if (!response.ok) {
        throw new Error('Failed to update agent')
    }

    return response.json()
}
