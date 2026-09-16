import { defineConfig } from "vite";

// Vercel / local: "/"
// GitHub Pages: defina VITE_BASE=/Controle-Tiago/ no workflow
const base = process.env.VITE_BASE || "/";

export default defineConfig({
  base,
  root: ".",
  publicDir: "public",
  server: {
    port: 5173,
    host: "127.0.0.1",
    open: "/"
  },
  preview: {
    port: 4173,
    host: "127.0.0.1",
    open: base
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
