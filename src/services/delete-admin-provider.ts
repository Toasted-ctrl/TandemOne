import { decisionAgentError } from './get-decision-agent'

export async function deleteAdminProvider(providerId: string): Promise<void> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const params = new URLSearchParams({ id: providerId })
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/providers?${params}`, {
            method: 'DELETE',
            headers: {
                'X-API-Key': applicationKey
            },
            credentials: 'include'
        }
    )

    if (!response.ok) {
        throw await decisionAgentError(response, 'Failed to delete provider')
    }
}
