import { useState } from "react"

export type ThemePreference = "light" | "dark" | "funky" | "terminal" | "system"

const STORAGE_KEY = "theme"
const THEME_COLORS = { light: "#f6f5f2", dark: "#0a0a0b", funky: "#12052a", terminal: "#050806" }
// Styled themes are dark variants: each gets its own class on <html> on top of `.dark`
const STYLED_THEMES = ["funky", "terminal"] as const
const darkQuery = window.matchMedia("(prefers-color-scheme: dark)")

export function getThemePreference(): ThemePreference {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === "light" || stored === "dark" || stored === "funky" || stored === "terminal" ? stored : "system"
}

// Mirrors the inline script in index.html, which runs before first paint.
// Styled themes also set `.dark` to pick up the `dark:` variants.
function applyTheme(preference: ThemePreference) {
    const styled = STYLED_THEMES.find((theme) => theme === preference)
    const dark = !!styled || preference === "dark" || (preference === "system" && darkQuery.matches)
    document.documentElement.classList.toggle("dark", dark)
    for (const theme of STYLED_THEMES) document.documentElement.classList.toggle(theme, theme === styled)
    document.querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", styled ? THEME_COLORS[styled] : dark ? THEME_COLORS.dark : THEME_COLORS.light)
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
