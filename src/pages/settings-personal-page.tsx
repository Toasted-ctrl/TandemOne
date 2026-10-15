import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppHeader } from "../components/app-header"
import { getUser, type User } from "../services/get-user"

export function SettingsPersonalPage() {
    const navigate = useNavigate()
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        getUser()
            .then(setUser)
            .catch(() => navigate("/login", { replace: true }))
    }, [navigate])

    const fields = user
        ? [
            { label: "First name", value: user.first_name },
            { label: "Last name", value: user.last_name },
            { label: "User ID", value: user.user_id },
        ]
        : []

    return (
        <div className="flex min-h-svh flex-col bg-ui-950 bg-grid">
            <AppHeader />
            <div className="flex-1 px-4 py-10">
            <div className="mx-auto max-w-xl">
                <h1 className="text-2xl font-bold tracking-tight text-ui-50">
                    Personal
                </h1>
                <p className="mt-2 text-sm text-ui-400">
                    Your account details.
                </p>

                {!user ? (
                    <div className="mt-8 text-sm text-ui-500">Loading account...</div>
                ) : (
                    <div className="mt-8 divide-y divide-ui-800 rounded-xl border border-ui-800 bg-ui-900">
                        {fields.map((field) => (
                            <div key={field.label} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                                <span className="text-sm text-ui-400">{field.label}</span>
                                <span className="break-all text-sm font-medium text-ui-50">{field.value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            </div>
        </div>
    )
}
