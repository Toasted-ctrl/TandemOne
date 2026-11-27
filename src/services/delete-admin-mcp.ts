export async function deleteAdminMcp(mcpId: string): Promise<void> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const params = new URLSearchParams({ mcp_id: mcpId })
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/tools/mcp?${params}`, {
            method: 'DELETE',
            headers: {
                'X-API-Key': applicationKey
            },
            credentials: 'include'
        }
    )

    if (!response.ok) {
        throw new Error('Failed to delete MCP')
    }
}
