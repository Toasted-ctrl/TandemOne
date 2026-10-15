import { Link } from "react-router-dom"
import { LogoMark, Wordmark } from "./logo"

export type LegalSection = {
    title: string
    body: string
}

type LegalPageProps = {
    title: string
    lastUpdated: string
    sections: LegalSection[]
}

export function LegalPage({ title, lastUpdated, sections }: LegalPageProps) {
    return (
        <main className="min-h-svh bg-ui-950 bg-grid px-4 py-12">
            <div className="mx-auto max-w-2xl">
                <div className="mb-10 text-center">
                    <Link to="/login" className="inline-block">
                        <LogoMark className="mx-auto mb-5 h-14 w-[4.4rem]" />
                        <span className="text-4xl">
                            <Wordmark />
                        </span>
                    </Link>
                </div>

                <div className="rounded-2xl border border-ui-800 bg-ui-900 p-8 shadow-2xl shadow-black/5 dark:shadow-black/40">
                    <h1 className="text-2xl font-bold tracking-tight text-ui-50">
                        {title}
                    </h1>
                    <p className="mt-2 text-sm text-ui-500">
                        Last updated: {lastUpdated}
                    </p>

                    <div className="mt-8 space-y-6">
                        {sections.map((section) => (
                            <section key={section.title}>
                                <h2 className="text-base font-semibold text-ui-50">
                                    {section.title}
                                </h2>
                                <p className="mt-2 text-sm leading-relaxed text-ui-400">
                                    {section.body}
                                </p>
                            </section>
                        ))}
                    </div>
                </div>

                <p className="mt-6 text-center text-xs text-ui-500">
                    <Link to="/login" className="text-ui-400 underline underline-offset-2 hover:text-ui-50 transition-colors">
                        Back to sign in
                    </Link>
                    {" · "}
                    <Link to="/terms" className="text-ui-400 underline underline-offset-2 hover:text-ui-50 transition-colors">
                        Terms of Service
                    </Link>
                    {" · "}
                    <Link to="/privacy" className="text-ui-400 underline underline-offset-2 hover:text-ui-50 transition-colors">
                        Privacy Policy
                    </Link>
                </p>
            </div>
        </main>
    )
}
