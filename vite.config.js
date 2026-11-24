import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build`            → PWA normal em dist/ (hospede em Vercel, Netlify etc.)
// `npm run build:single`     → um único HTML autocontido em dist-single/
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  server: { host: true },
  build: mode === 'single' ? { outDir: 'dist-single', copyPublicDir: false } : {},
  define: mode === 'single' ? { 'import.meta.env.VITE_SINGLEFILE': '"1"' } : {},
}))
