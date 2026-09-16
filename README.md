# Controle-Tiago

Site de finanças da Martins Imóveis (HTML, CSS e JavaScript) com backup na nuvem via Supabase.

## Como abrir

Abra o arquivo `index.html` no navegador (de preferência por um servidor local `http://`, não só `file://`).

## Login

- Usuário: `Tiago`
- Senha: a configurada no app (padrão inicial definido no código)

## Supabase (salvar na nuvem)

1. Abra o projeto no Supabase → **SQL Editor**
2. Cole e execute o arquivo `sql/schema.sql`
3. No site, entre e use **Configurações → Salvar na nuvem**

Depois disso, cada alteração também tenta sincronizar automaticamente com a nuvem (além do navegador).

## Segurança

- No frontend use **apenas** a URL + chave **anon**
- Nunca publique `service_role`, senha do Postgres ou JWT secret no GitHub ou no código do site
