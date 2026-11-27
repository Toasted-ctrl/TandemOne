import { decisionAgentError } from './get-decision-agent'

export async function deleteAdminModel(modelName: string): Promise<void> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const params = new URLSearchParams({ model_name: modelName })
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/models?${params}`, {
            method: 'DELETE',
            headers: {
                'X-API-Key': applicationKey
            },
            credentials: 'include'
        }
    )

    if (!response.ok) {
        throw await decisionAgentError(response, 'Failed to delete model')
    }
}
