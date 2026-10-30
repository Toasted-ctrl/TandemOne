export type VectorStoreMetadata = {
    document_name: string
}

export async function addToVectorStore(
    scope: string,
    texts: string[],
    metadatas: VectorStoreMetadata[]
): Promise<void> {
    const applicationKey = import.meta.env.VITE_API_KEY
    const params = new URLSearchParams({ scope })
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/documents/vector-store/add?${params}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': applicationKey
            },
            credentials: 'include',
            body: JSON.stringify({ texts, metadatas })
        }
    )

    if (!response.ok) {
        throw new Error('Failed to add documents to vector store')
    }
}
