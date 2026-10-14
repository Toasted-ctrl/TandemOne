export type AgentAccessType = 'User Owned' | 'All'

export type AgentSummary = {
    id: string
    name: string
}

export type AgentsResponse = {
    agents: AgentSummary[]
}

export async function getAgents(accessType: AgentAccessType): Promise<AgentsResponse> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const params = new URLSearchParams({ access_type: accessType })
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/agents?${params}`, {
            headers: {
                'X-API-Key': applicationKey
            },
            credentials: 'include'
        }
    )

    if (!response.ok) {
        throw new Error('Failed to fetch agents')
    }

    return response.json()
}
