import { decisionAgentError } from './get-decision-agent'

export type DecisionRequest = {
    agent_id: string
    // A string if the agent's state type is 'text', or field name to value if it is 'fields'
    state: string | Record<string, string>
}

// Keyed by question name; the shape of each answer is defined by the backend
export type DecisionAnswer = Record<string, unknown>

export type DecisionResult = {
    agent_id: string
    answers: Record<string, DecisionAnswer>
}

export async function runDecision(request: DecisionRequest): Promise<DecisionResult> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/inference/decision`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': applicationKey
            },
            credentials: 'include',
            body: JSON.stringify(request)
        }
    )

    if (!response.ok) {
        throw await decisionAgentError(response, 'Failed to run decision')
    }

    return response.json()
}
