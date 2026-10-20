import type { SkillPayload } from './add-skill'
import type { Skill } from './get-skill'

// The update replaces the whole skill, so all fields are required
export type SkillUpdatePayload = SkillPayload & {
    skill_id: string
}

export async function updateSkill(scope: string, update: SkillUpdatePayload): Promise<Skill> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/skill?scope=${encodeURIComponent(scope)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': applicationKey
            },
            credentials: 'include',
            body: JSON.stringify(update)
        }
    )

    if (!response.ok) {
        throw new Error('Failed to update skill')
    }

    return response.json()
}
