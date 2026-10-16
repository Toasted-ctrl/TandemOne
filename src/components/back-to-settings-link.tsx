import { Link } from "react-router-dom"

export function BackToSettingsLink() {
    return (
        <Link
            to="/settings"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-ui-400 transition-colors hover:text-ui-50"
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to settings
        </Link>
    )
}
