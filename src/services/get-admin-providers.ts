// The class the API uses to talk to the provider
export type LangChainCon = 'ChatAnthropic' | 'ChatOllama' | 'ChatOpenAI' | 'ChatGoogleGenerativeAI'

export const LANGCHAIN_CONNECTIONS: { value: LangChainCon; label: string }[] = [
    { value: 'ChatAnthropic', label: 'Anthropic' },
    { value: 'ChatGoogleGenerativeAI', label: 'Google Generative AI' },
    { value: 'ChatOllama', label: 'Ollama' },
    { value: 'ChatOpenAI', label: 'OpenAI (and compatible)' },
]

export type AdminProvider = {
    id: string
    name: string
    base_url: string
    internal: boolean
    requires_api_key: boolean
    langchain_con: LangChainCon
    mac_address: string | null
    host: string | null
}

export type AdminProvidersResponse = {
    providers: AdminProvider[]
}

export async function getAdminProviders(): Promise<AdminProvidersResponse> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/providers`, {
            headers: {
                'X-API-Key': applicationKey
            },
            credentials: 'include'
        }
    )

    // The API answers 404 when no providers have been added yet
    if (response.status === 404) {
        return { providers: [] }
    }

    if (!response.ok) {
        throw new Error('Failed to fetch providers')
    }

    return response.json()
}
