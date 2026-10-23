export async function saveUserKey(providerName: string, apiKey: string, expiryDays: number): Promise<void> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/settings/user/keys`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': applicationKey
            },
            credentials: 'include',
            body: JSON.stringify({
                provider: providerName,
                api_key: apiKey,
                expiry_days: expiryDays,
            })
        }
    )

    if (!response.ok) {
        throw new Error('Failed to save API key')
    }
}
