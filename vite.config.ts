import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // caminhos relativos — necessário para o Electron abrir via file://
  plugins: [react()],
  server: { port: 5173 }
})
