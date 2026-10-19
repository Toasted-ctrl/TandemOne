export type ProviderConfiguration = {
    id: string
    name: string
    internal: boolean
    requires_api_key: boolean
    api_key_configured: boolean
    api_key_id: string | null
    api_key_short: string | null
    api_key_expiry_date: string | null
}


export type ProviderConfigurationResponse = {
    providers: ProviderConfiguration[]
}


export async function getProviderConfiguration(): Promise<ProviderConfigurationResponse> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/providers/configuration`, {
            headers: {
                'X-API-Key': applicationKey
            },
            credentials: 'include'
        }
    )

    if (!response.ok) {
        throw new Error('Failed to fetch provider configuration')
    }

    return response.json()
}
