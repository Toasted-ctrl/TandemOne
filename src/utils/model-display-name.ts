// Short label for a model id: everything after the last slash.
// e.g. "accounts/fireworks/models/ember-1" -> "ember-1", "z-ai/glm-5.3" -> "glm-5.3".
// Display only; always send the full id to the backend.
export function modelDisplayName(model: string): string {
    const short = model.slice(model.lastIndexOf("/") + 1)
    return short || model
}
