import { useState } from "react"

export type ThemePreference = "light" | "dark" | "funky" | "system"

const STORAGE_KEY = "theme"
const THEME_COLORS = { light: "#f6f5f2", dark: "#0a0a0b", funky: "#12052a" }
const darkQuery = window.matchMedia("(prefers-color-scheme: dark)")

export function getThemePreference(): ThemePreference {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === "light" || stored === "dark" || stored === "funky" ? stored : "system"
}

// Mirrors the inline script in index.html, which runs before first paint.
// Funky is a dark theme, so it also sets `.dark` to pick up the `dark:` variants.
function applyTheme(preference: ThemePreference) {
    const funky = preference === "funky"
    const dark = funky || preference === "dark" || (preference === "system" && darkQuery.matches)
    document.documentElement.classList.toggle("dark", dark)
    document.documentElement.classList.toggle("funky", funky)
    document.querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", funky ? THEME_COLORS.funky : dark ? THEME_COLORS.dark : THEME_COLORS.light)
}

// Follow OS changes app-wide while the preference is "system"
darkQuery.addEventListener("change", () => {
    if (getThemePreference() === "system") applyTheme("system")
})

export function useTheme() {
    const [preference, setPreference] = useState(getThemePreference)

    function setTheme(next: ThemePreference) {
        if (next === "system") localStorage.removeItem(STORAGE_KEY)
        else localStorage.setItem(STORAGE_KEY, next)
        applyTheme(next)
        setPreference(next)
    }

    return { preference, setTheme }
}
