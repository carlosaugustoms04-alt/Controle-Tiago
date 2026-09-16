import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  // Em produção (GitHub Pages) usa o subpath do repositório.
  // Em desenvolvimento local fica na raiz: http://127.0.0.1:5173/
  base: command === "build" ? "/Controle-Tiago/" : "/",
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
    open: "/Controle-Tiago/"
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
}));
