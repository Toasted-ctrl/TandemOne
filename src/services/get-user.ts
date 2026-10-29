export type User = {
    user_id: string
    first_name: string
    last_name: string
}


export async function getUser(): Promise<User> {
    console.log("Calling /api/v1/user/me")
    const applicationKey = import.meta.env.VITE_API_KEY
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/user/me`, {
            headers: {
                'X-API-Key': applicationKey
            },
            credentials: 'include'
        }
    )

    if (!response.ok) {
        throw new Error('Failed to fetch user')
    }

    return response.json()
}