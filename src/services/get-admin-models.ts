// Only the expertises the frontends currently use; the API also knows translation and vector_embedding
export type ManagedExpertise = 'chat_completion' | 'system_one'

export type AdminModelsResponse = {
    expertise: ManagedExpertise
    models: string[]
}

export async function getAdminModels(expertise: ManagedExpertise): Promise<AdminModelsResponse> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const params = new URLSearchParams({ expertise })
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/models?${params}`, {
            headers: {
                'X-API-Key': applicationKey
            },
            credentials: 'include'
        }
    )

    if (!response.ok) {
        throw new Error('Failed to fetch models')
    }

    return response.json()
}
