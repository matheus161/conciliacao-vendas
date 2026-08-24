# Katalagge

SaaS multi-tenant de conciliação de vendas para redes de franquias/lojas.

## O que é

Lojistas hoje conciliam vendas manualmente: baixam extratos do sistema de faturamento, das operadoras de cartão, dos bancos e do Sitef, e comparam tudo em planilha pra achar divergências (venda cancelada que ainda aparece faturada, venda não lançada, etc). O Katalagge automatiza essa comparação por loja, aponta as divergências e gerencia a resolução via chamados.

Modelo: cada cliente (Grupo, ex: uma franquia) tem múltiplas lojas, cadastro público e self-service (cadastra, configura lojas/fontes, assina plano). Papéis por grupo: `admin`, `operator`, `support`.

Detalhes completos do produto em `docs/superpowers/specs/2026-08-21-conciliacao-saas-design.md`. Plano de implementação da fundação multi-tenant em `docs/superpowers/plans/2026-08-21-fundacao-multitenant.md`.

## Stack

Next.js 14 (App Router) + TypeScript, Prisma + PostgreSQL, bcryptjs (hash de senha), jose (sessão JWT), zod (validação), Vitest (testes).

## Como rodar

Pré-requisitos: Node 20+, Docker.

```bash
# instalar dependências
npm install

# subir o Postgres (porta 5433 no host — 5432 pode estar ocupada por outro projeto)
docker compose up -d postgres

# criar o banco de teste (só na primeira vez)
docker compose exec postgres createdb -U postgres conciliacao_test

# copiar variáveis de ambiente
cp .env.example .env
cp .env.example .env.test
# editar .env.test pra apontar pro banco conciliacao_test

# rodar migrations + gerar client Prisma
npx prisma migrate dev

# subir o app em modo dev
npm run dev
```

App sobe em `http://localhost:3000`.

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` / `npm run start` — build e start de produção
- `npm run test` — roda os testes (Vitest)
- `npm run db:generate` — gera o Prisma Client
- `npm run db:migrate` — cria/aplica migrations em dev
