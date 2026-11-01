import { decisionAgentError } from './get-decision-agent'

export type SharedAgent = {
    id: string
}

// Requester must be the owner of the agent
export async function shareAgent(agentId: string, shareWithUserId: string): Promise<SharedAgent> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const params = new URLSearchParams({ agent_id: agentId, share_with_user_id: shareWithUserId })
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/share/agent?${params}`, {
            method: 'POST',
            headers: {
                'X-API-Key': applicationKey
            },
            credentials: 'include'
        }
    )

    if (!response.ok) {
        throw await decisionAgentError(response, 'Failed to share agent')
    }

    return response.json()
}
