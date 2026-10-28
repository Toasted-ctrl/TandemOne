export type DecisionAgentModel = {
    provider: string
    name: string
}

export type DecisionStateField = {
    name: string
    description: string | null
}

export type DecisionState = {
    // 'text': callers send state as a single string; 'fields': as an object with these named fields
    type: 'text' | 'fields'
    description: string | null
    // Must be empty for 'text' and non-empty for 'fields'
    fields: DecisionStateField[]
}

// Score answers are a level index into `legend`, starting at 0; noul answers are a value between 0 and 1
export type DecisionQuestion =
    | { type: 'choice'; name: string; instructions: string; options: string[] }
    | { type: 'score'; name: string; instructions: string; legend: string[] }
    | { type: 'noul'; name: string; instructions: string }

export type DecisionAgentPayload = {
    name: string
    description: string | null
    model: DecisionAgentModel
    state: DecisionState
    questions: DecisionQuestion[]
}

export type DecisionAgent = DecisionAgentPayload & {
    id: string
}

// FastAPI returns `detail` as a string for HTTP errors and as a list for validation errors
export async function decisionAgentError(response: Response, fallback: string): Promise<Error> {
    const body = await response.json().catch(() => null)
    return new Error(typeof body?.detail === 'string' ? body.detail : fallback)
}

export async function getDecisionAgent(agentId: string): Promise<DecisionAgent> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const params = new URLSearchParams({ agent_id: agentId })
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/playground/decision-agent?${params}`, {
            headers: {
                'X-API-Key': applicationKey
            },
            credentials: 'include'
        }
    )

    if (!response.ok) {
        throw await decisionAgentError(response, 'Failed to fetch decision agent')
    }

    return response.json()
}
