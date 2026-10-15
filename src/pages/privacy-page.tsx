import { LegalPage, type LegalSection } from "../components/legal-page"

const LAST_UPDATED = "October 15, 2026"

const sections: LegalSection[] = [
    {
        title: "1. Overview",
        body: "This Privacy Policy explains what information Tandem One (the \"Service\") collects when you use it, how that information is used, and the choices you have. We only collect what we need to run the Service.",
    },
    {
        title: "2. Information from your Google account",
        body: "When you sign in with Google, we receive basic profile information such as your name, email address and a unique account identifier. We use this to create and identify your account. We do not receive your Google password.",
    },
    {
        title: "3. Content you provide",
        body: "We store the content you create or upload so the Service can work: chat messages, uploaded documents, saved memories, skills and agent configurations. Uploaded documents, memories and skill descriptions are processed into a searchable index so your models and agents can retrieve them.",
    },
    {
        title: "4. API keys",
        body: "If you add API keys for AI providers, they are stored on our servers and used only to send requests to those providers on your behalf. We do not use your keys for any other purpose.",
    },
    {
        title: "5. Sharing with AI providers and tools",
        body: "When you chat with a model or agent, your messages and any relevant content (such as retrieved documents, memories or tool results) are sent to the AI provider you selected and, where enabled, to tools such as web search or MCP servers. Those third parties process the data under their own privacy policies. We do not sell your personal information.",
    },
    {
        title: "6. Cookies and local storage",
        body: "We use a session cookie to keep you signed in. Your theme preference (light, dark or system) is stored in your browser's local storage. We do not use advertising or third-party analytics cookies.",
    },
    {
        title: "7. Data retention and deletion",
        body: "We keep your information for as long as your account is active. You can delete uploaded documents, memories and agents from within the Service at any time. To request deletion of your account and associated data, contact us.",
    },
    {
        title: "8. Security",
        body: "We use reasonable technical and organizational measures to protect your information, including encrypted connections. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.",
    },
    {
        title: "9. Your rights",
        body: "Depending on where you live, you may have the right to access, correct, export or delete your personal information, or to object to certain processing. Contact us to exercise these rights.",
    },
    {
        title: "10. Changes to this policy",
        body: "We may update this Privacy Policy from time to time. When we do, we will revise the date at the top of this page. Continued use of the Service after changes take effect means you accept the updated policy.",
    },
]

export function PrivacyPage() {
    return <LegalPage title="Privacy Policy" lastUpdated={LAST_UPDATED} sections={sections} />
}
