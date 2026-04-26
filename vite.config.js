import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// When deploying to GitHub Pages under https://<user>.github.io/<repo>/
// the bundle must be served from /<repo>/ — set VITE_BASE_PATH accordingly
// (the deploy workflow passes it in automatically). For local dev it stays "/".
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
})
