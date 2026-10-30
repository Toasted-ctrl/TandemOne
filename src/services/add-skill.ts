export type SkillPayload = {
    name: string
    description: string
    skill_text: string
    parameters_schema: Record<string, unknown>
}

export const SKILL_DESCRIPTION_MAX_LENGTH = 1000

export async function addSkill(scope: string, skill: SkillPayload): Promise<void> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/documents/skill?scope=${encodeURIComponent(scope)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': applicationKey
            },
            credentials: 'include',
            body: JSON.stringify(skill)
        }
    )

    if (!response.ok) {
        throw new Error('Failed to save skill')
    }
}
