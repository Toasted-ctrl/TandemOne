export async function deleteDecisionAgent(agentId: string): Promise<void> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const params = new URLSearchParams({ agent_id: agentId })
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/playground/decision-agent?${params}`, {
            method: 'DELETE',
            headers: {
                'X-API-Key': applicationKey
            },
            credentials: 'include'
        }
    )

    if (!response.ok) {
        throw new Error('Failed to delete decision agent')
    }
}
