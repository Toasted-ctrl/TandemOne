import { GoogleLoginButton } from "../components/google-login-button"
import { loginWithGoogle } from "../features/auth/login"
import { LogoMark, Wordmark } from "../components/logo"

export function LoginPage() {
    return (
        <main className="flex min-h-svh items-center justify-center bg-ui-950 bg-grid px-4">
            <div className="w-full max-w-sm">
                <div className="mb-10 text-center">
                    <LogoMark className="mx-auto mb-5 h-14 w-[4.4rem]" />
                    <h1 className="text-4xl">
                        <Wordmark />
                    </h1>
                    <p className="mt-2 text-sm text-ui-400">
                        Sign in to continue
                    </p>
                </div>

                <div className="rounded-2xl border border-ui-800 bg-ui-900 p-8 shadow-2xl shadow-black/5 dark:shadow-black/40">
                    <GoogleLoginButton onLogin={loginWithGoogle} />

                    <p className="mt-6 text-center text-xs text-ui-500">
                        By continuing, you agree to our{" "}
                        <a href="#" className="text-ui-400 underline underline-offset-2 hover:text-ui-50 transition-colors">
                            Terms of Service
                        </a>
                    </p>
                </div>
            </div>
        </main>
    )
}