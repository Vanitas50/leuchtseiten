import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this from /leuchtseiten/; Vercel serves it from the
  // domain root and sets VERCEL=1 during its build, so branch on that.
  base: process.env.VERCEL ? '/' : '/leuchtseiten/',
  plugins: [react()],
})
