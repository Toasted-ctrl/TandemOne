import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { getRoot } from "../services/get-root"
import { getUser, isAdmin } from "../services/get-user"
import { Wordmark } from "./logo"

type NavDrawerProps = {
    open: boolean
    onClose: () => void
}

type NavItem = {
    to: string
    label: string
    icon: React.ReactNode
}

const navGroups: { label: string; items: NavItem[] }[] = [
    {
        label: "Inference",
        items: [
        {
            to: "/chat",
            label: "Chat",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            ),
        },
        {
            to: "/decisions",
            label: "Decisions",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="6" cy="6" r="3" />
                    <circle cx="18" cy="6" r="3" />
                    <circle cx="6" cy="18" r="3" />
                    <path d="M6 9v6" />
                    <path d="M18 9a9 9 0 0 1-9 9" />
                </svg>
            ),
        },
        ],
    },
    {
        label: "Build",
        items: [
        {
            to: "/playground",
            label: "Playground",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="8" width="18" height="12" rx="2" />
                    <path d="M12 8V4" />
                    <circle cx="12" cy="3" r="1" />
                    <path d="M9 13v2M15 13v2" />
                </svg>
            ),
        },
        {
            to: "/my-documents",
            label: "My Documents",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
            ),
        },
        ],
    },
]

// Only shown to admins (is_admin or is_super_admin)
const manageGroup: { label: string; items: NavItem[] } = {
    label: "Manage",
    items: [
        {
            to: "/manage/models",
            label: "Models",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <rect x="9" y="9" width="6" height="6" />
                    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
                </svg>
            ),
        },
        {
            to: "/manage/providers",
            label: "Providers",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="8" rx="2" />
                    <rect x="2" y="13" width="20" height="8" rx="2" />
                    <line x1="6" y1="7" x2="6.01" y2="7" />
                    <line x1="6" y1="17" x2="6.01" y2="17" />
                </svg>
            ),
        },
        {
            to: "/manage/tools",
            label: "Tools",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
            ),
        },
    ],
}

// Kept apart from the groups, at the bottom of the drawer
const settingsItem: NavItem = {
    to: "/settings",
    label: "Settings",
    icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
}

function NavLink({ item, onClick }: { item: NavItem; onClick: () => void }) {
    const location = useLocation()
    const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/")
    return (
        <Link
            to={item.to}
            onClick={onClick}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                    ? "bg-brand-500/10 text-brand-400 shadow-[inset_3px_0_0_var(--color-brand-500)]"
                    : "text-ui-400 hover:bg-ui-800/60 hover:text-ui-200"
            }`}
        >
            {item.icon}
            {item.label}
        </Link>
    )
}

export function NavDrawer({ open, onClose }: NavDrawerProps) {
    const [apiVersion, setApiVersion] = useState<string | null>(null)
    const [showManage, setShowManage] = useState(false)

    useEffect(() => {
        getRoot()
            .then((data) => setApiVersion(data.version))
            .catch(() => setApiVersion(null))
        getUser()
            .then((user) => setShowManage(isAdmin(user)))
            .catch(() => setShowManage(false))
    }, [])

    const groups = showManage ? [...navGroups, manageGroup] : navGroups

    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose()
        }
        if (open) {
            document.addEventListener("keydown", handleKey)
            return () => document.removeEventListener("keydown", handleKey)
        }
    }, [open, onClose])

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
                onClick={onClose}
            />

            <nav
                className={`fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r border-ui-700/60 bg-ui-900 shadow-xl transition-transform duration-200 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="flex items-center justify-between border-b border-ui-700/60 px-4 py-3">
                    <Wordmark className="text-xl" />
                    <button
                        onClick={onClose}
                        className="flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-ui-400 transition hover:bg-ui-800 hover:text-ui-200"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
                    {groups.map((group) => (
                        <div key={group.label}>
                            <div className="px-3 pt-1 pb-1.5 text-[11px] font-medium tracking-wide text-ui-500 uppercase">
                                {group.label}
                            </div>
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <NavLink key={item.to} item={item} onClick={onClose} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t border-ui-700/60 px-3 py-3">
                    <NavLink item={settingsItem} onClick={onClose} />
                </div>

                <div className="border-t border-ui-700/60 px-4 py-3 space-y-0.5">
                    <p className="text-xs text-ui-500">App version: {__APP_VERSION__}</p>
                    {apiVersion && <p className="text-xs text-ui-500">API version: {apiVersion}</p>}
                </div>
            </nav>
        </>
    )
}
