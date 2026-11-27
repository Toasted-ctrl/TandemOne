export type McpTransport = 'streamable_http'

export type McpPayload = {
    name: string
    transport: McpTransport
    url: string
}

export async function createAdminMcp(mcp: McpPayload): Promise<void> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/tools/mcp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': applicationKey
            },
            credentials: 'include',
            body: JSON.stringify(mcp)
        }
    )

    if (!response.ok) {
        throw new Error('Failed to add MCP')
    }
}
