import { useState } from "react"
import { NavDrawer } from "./nav-drawer"
import { Wordmark } from "./logo"

type AppHeaderProps = {
    showNewChat?: boolean
    onNewChat?: () => void
}

export function AppHeader({ showNewChat, onNewChat }: AppHeaderProps) {
    const [drawerOpen, setDrawerOpen] = useState(false)

    return (
        <>
            <header className="flex shrink-0 items-center justify-between border-b border-ui-700/60 bg-ui-950 px-4 py-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-ui-300 transition hover:bg-ui-800 hover:text-ui-50"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12h18M3 6h18M3 18h18" />
                        </svg>
                    </button>
                    <h1><Wordmark className="text-xl" /></h1>
                </div>
                {showNewChat && onNewChat && (
                    <button
                        onClick={onNewChat}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-ui-800 px-3 py-2 text-xs font-semibold text-ui-300 transition hover:bg-ui-700 hover:text-brand-400"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        New chat
                    </button>
                )}
            </header>
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </>
    )
}
