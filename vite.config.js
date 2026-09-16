import { defineConfig } from "vite";

export default defineConfig({
  // Necessário para GitHub Pages: https://carlosaugustoms04-alt.github.io/Controle-Tiago/
  base: "/Controle-Tiago/",
  root: ".",
  publicDir: "public",
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
