import { decisionAgentError, type DecisionAgent, type DecisionAgentPayload } from './get-decision-agent'

export async function updateDecisionAgent(agentId: string, agent: DecisionAgentPayload): Promise<DecisionAgent> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const params = new URLSearchParams({ agent_id: agentId })
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/playground/decision-agent?${params}`, {
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
        throw await decisionAgentError(response, 'Failed to update decision agent')
    }

    return response.json()
}
