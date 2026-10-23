export async function deleteUserKey(keyId: string): Promise<void> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const params = new URLSearchParams({ key_id: keyId })
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/settings/user/keys?${params}`, {
            method: 'DELETE',
            headers: {
                'X-API-Key': applicationKey
            },
            credentials: 'include'
        }
    )

    if (!response.ok) {
        throw new Error('Failed to delete API key')
    }
}
