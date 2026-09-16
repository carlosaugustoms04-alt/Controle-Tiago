# Controle-Tiago

Site de finanças da Martins Imóveis com backup na nuvem via Supabase.

## Site online

https://carlosaugustoms04-alt.github.io/Controle-Tiago/

## Desenvolvimento local

```bash
npm install
npm run dev
```

Abra o endereço do terminal (em geral `http://localhost:5173/Controle-Tiago/`).

Build de produção:

```bash
npm run build
npm run preview
```

## Supabase

1. No Supabase → **SQL Editor**, execute o conteúdo de `sql/schema.sql`
2. Credenciais de produção ficam em `.env.production` (chave publishable/anon — pública no frontend)
3. Para desenvolvimento local, use o arquivo `.env` (não vai para o Git)

## Login

- Usuário: `Tiago`
- Senha: a configurada no app

## Deploy (GitHub Pages)

Cada push na branch `main` dispara o workflow `.github/workflows/deploy-pages.yml`.

Na primeira vez, no GitHub do repositório:

**Settings → Pages → Build and deployment → Source: GitHub Actions**
