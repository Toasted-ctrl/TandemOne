// Home-screen apps on iOS resume from memory instead of reloading, so they keep running old code
// after a deploy. When the app comes back to the foreground, compare the deployed version with
// the running one and reload if they differ.

const RELOAD_KEY = 'update-check:reloaded-for'

async function checkForUpdate() {
    try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return
        const { version } = (await res.json()) as { version?: string }
        if (!version || version === __APP_VERSION__) return

        // Avoid a reload loop if a stale cache keeps serving the old bundle
        if (sessionStorage.getItem(RELOAD_KEY) === version) return
        sessionStorage.setItem(RELOAD_KEY, version)
        window.location.reload()
    } catch {
        // Offline or not deployed with version.json (e.g. dev server); ignore
    }
}

if (import.meta.env.PROD) {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate()
    })
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) checkForUpdate()
    })
}
