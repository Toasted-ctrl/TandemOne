import { decisionAgentError, type DecisionAgent, type DecisionAgentPayload } from './get-decision-agent'

export async function createDecisionAgent(agent: DecisionAgentPayload): Promise<DecisionAgent> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/playground/decision-agent`, {
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
        throw await decisionAgentError(response, 'Failed to save decision agent')
    }

    return response.json()
}
