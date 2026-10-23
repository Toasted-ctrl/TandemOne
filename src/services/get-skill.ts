export type Skill = {
    skill_id: string
    name: string
    description: string
    instructions: string
    parameter_schema: Record<string, unknown>
    // Legacy skills were stored unencrypted; saving them again encrypts them
    is_encrypted: boolean
}

export async function getSkill(skillId: string, scope: string): Promise<Skill> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const params = new URLSearchParams({ skill_id: skillId, scope })
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/skill?${params}`, {
            headers: {
                'X-API-Key': applicationKey
            },
            credentials: 'include'
        }
    )

    if (!response.ok) {
        throw new Error('Failed to fetch skill')
    }

    return response.json()
}
