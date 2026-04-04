# FastConsig — CRM/ERP Starter Kit

Monólito modular, multitenancy-first, pronto para escalar.

## Stack

| Camada     | Tecnologia                        |
|------------|-----------------------------------|
| Backend    | Node.js · TypeScript · Express    |
| ORM        | Prisma                            |
| Banco      | PostgreSQL 15                     |
| Frontend   | Next.js 14 (App Router) · Tailwind|
| UI         | Design system customizado (packages/ui) |
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

## Enterprise Control Plane (novo)

- **Versionamento e rollback de config**: histórico em `config_value_versions` e endpoint de rollback.
- **Audit trail persistente**: trilha em `audit_trails` com filtros e export JSON.
- **Event bus durável**: outbox em `event_outbox` com retry + dead-letter.
- **Observabilidade avançada**: headers de tracing (`x-trace-id`, `x-span-id`) e snapshot operacional.
- **Isolamento de plugins**: limites e timeout de bootstrap no registry.

## Guias rápidos

- IA: `docs/ai-behavior-guidelines.md`
- Orquestrador humano: `docs/human-orchestrator-quick-guide.md`
- SLOs: `docs/slo.md`
- Runbooks: `docs/runbooks/incidents/*`

## Observabilidade de produção (Grafana + Prometheus + Alertmanager)

Serviços adicionados no `docker-compose.yml`:
- `prometheus` (`:9090`)
- `alertmanager` (`:9093`)
- `grafana` (`:3002`, admin/admin)
- `redis` (`:6379`) para event bus durável

Endpoints da API:
- JSON: `GET /api/metrics`
- Prometheus: `GET /metrics` (Bearer `METRICS_TOKEN` quando definido)
- Snapshot operacional autenticado: `GET /api/ops/observability`

Variáveis obrigatórias para produção:
- `METRICS_TOKEN`
- `GRAFANA_ADMIN_PASSWORD`
- `OPS_FAILED_EVENTS_WARNING_THRESHOLD` (opcional; default 10)

Subir stack:

```bash
docker compose up -d
```

## Scripts

| Comando              | Descrição                    |
|----------------------|------------------------------|
| `npm run dev`        | Sobe todos os apps em watch  |
| `npm run build`      | Build de produção            |
| `npm run lint`       | Lint em todos os pacotes     |
| `npm run typecheck`  | Type-check em todos          |
| `npm run test`       | Testes em todos              |
