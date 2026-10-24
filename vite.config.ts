import { readFileSync } from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const appVersion = readFileSync('VERSION', 'utf-8').trim()

export default defineConfig(({ mode }) => {
  // No VITE_ prefix, so this stays out of the client bundle
  const env = loadEnv(mode, process.cwd(), '')
  const allowedHosts = env.DEV_ALLOWED_HOSTS
    ? env.DEV_ALLOWED_HOSTS.split(',').map((host) => host.trim()).filter(Boolean)
    : []

  return {
    plugins: [tailwindcss(), react()],

    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },

    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts,
    },
  }
})
