# FastConsig — CRM/ERP Starter Kit

Monólito modular, multitenancy-first, pronto para escalar.

## Stack

| Camada     | Tecnologia                        |
|------------|-----------------------------------|
| Backend    | Node.js · TypeScript · Express    |
| ORM        | Prisma                            |
| Banco      | PostgreSQL 15                     |
| Frontend   | Next.js 14 (App Router) · Tailwind|
| Monorepo   | Turborepo                         |
| Infra      | Docker · Docker Compose           |
| CI/CD      | GitHub Actions                    |

## Estrutura

```
fastconsig/
├── apps/
│   ├── api/          # Backend (Express + Prisma)
│   └── web/          # Frontend (Next.js)
├── packages/
│   ├── ui/           # Design system (shadcn/ui)
│   ├── core/         # Lógica compartilhada
│   ├── types/        # Tipos globais
│   └── config/       # ESLint, tsconfig base
├── infrastructure/
│   ├── docker/       # Dockerfiles
│   └── ci/           # Scripts de CI auxiliares
├── docker-compose.yml
├── turbo.json
└── package.json
```

## Início rápido

```bash
# 1. Copie o env de exemplo
cp .env.example .env

# 2. Suba tudo via Docker
docker compose up -d

# 3. Execute as migrations
docker compose exec api npx prisma migrate dev
```

## Desenvolvimento local (sem Docker)

```bash
npm install
npm run dev
```

## Princípios de arquitetura

- **Controller → Service → Repository**: sem saltos de camada.
- **Multitenancy obrigatório**: toda entidade carrega `tenant_id`; toda query filtra por ele.
- **TypeScript strict**: proibido `any`.
- **Migrations only**: nunca edite o banco manualmente.
- Consulte `.github/copilot-instructions.md` para as regras completas.

## Scripts

| Comando              | Descrição                    |
|----------------------|------------------------------|
| `npm run dev`        | Sobe todos os apps em watch  |
| `npm run build`      | Build de produção            |
| `npm run lint`       | Lint em todos os pacotes     |
| `npm run typecheck`  | Type-check em todos          |
| `npm run test`       | Testes em todos              |
