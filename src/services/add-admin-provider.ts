import type { AdminProvider } from './get-admin-providers'
import { decisionAgentError } from './get-decision-agent'

export type AdminProviderPayload = Omit<AdminProvider, 'id' | 'host'>

export async function addAdminProvider(provider: AdminProviderPayload): Promise<AdminProvider> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/providers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': applicationKey
            },
            credentials: 'include',
            body: JSON.stringify(provider)
        }
    )

    if (!response.ok) {
        // Surfaces the API's message, e.g. on a 409 when the provider already exists
        throw await decisionAgentError(response, 'Failed to add provider')
    }

    return response.json()
}
