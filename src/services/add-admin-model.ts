import type { ManagedExpertise } from './get-admin-models'
import { decisionAgentError } from './get-decision-agent'

export type AdminModelPayload = {
    model_name: string
    expertise: ManagedExpertise
}

export type AdminModel = AdminModelPayload & {
    created_date: string
}

export async function addAdminModel(model: AdminModelPayload): Promise<AdminModel> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/models`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': applicationKey
            },
            credentials: 'include',
            body: JSON.stringify(model)
        }
    )

    if (!response.ok) {
        // Surfaces the API's message, e.g. on a 409 when the model already exists
        throw await decisionAgentError(response, 'Failed to add model')
    }

    return response.json()
}
