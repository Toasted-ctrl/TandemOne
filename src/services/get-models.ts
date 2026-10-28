export type ProviderModels = {
    chat_completion: string[]
    translation: string[]
    vector_embedding: string[]
    system_one: string[]
}


export type ModelCapability = keyof ProviderModels


export type ProvidersOffering = {
    providers: Record<string, ProviderModels>
}


export async function getProviderModels(): Promise<ProvidersOffering> {
    console.log("Calling /api/v1/models")
    const applicationKey = import.meta.env.VITE_API_KEY
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/providers/models`, {
            headers: {
                'X-API-Key': applicationKey
            },
            credentials: 'include'
        }
    )

    if (!response.ok) {
        throw new Error('Failed to fetch Models')
    }

    return response.json()
}