import type { Agent, AgentPayload } from './get-playground-agent'

export async function createPlaygroundAgent(agent: AgentPayload): Promise<Agent> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/playground/agent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': applicationKey
            },
            credentials: 'include',
            body: JSON.stringify(agent)
        }
    )

    if (!response.ok) {
        throw new Error('Failed to save agent')
    }

    return response.json()
}
