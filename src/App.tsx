import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ChatPage } from './pages/chat-page'
import { LoginPage } from './pages/login-page'
import { SettingsPage } from './pages/settings-page'
import { SettingsKeysPage } from './pages/settings-keys-page'
import { SettingsPersonalPage } from './pages/settings-personal-page'
import { MyDocumentsPage } from './pages/my-documents-page'
import { PlaygroundPage } from './pages/playground-page'
import { getUser } from './services/get-user'

function AuthRedirect() {
    const [target, setTarget] = useState<'/chat' | '/login' | null>(null)

    useEffect(() => {
        getUser()
            .then(() => setTarget('/chat'))
            .catch(() => setTarget('/login'))
    }, [])

    if (!target) return null

    return <Navigate to={target} replace />
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<AuthRedirect />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/keys" element={<SettingsKeysPage />} />
                <Route path="/settings/personal" element={<SettingsPersonalPage />} />
                <Route path="/my-documents" element={<MyDocumentsPage />} />
                <Route path="/playground" element={<PlaygroundPage />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
