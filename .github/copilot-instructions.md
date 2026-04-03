# 🚨 PROTOCOLO OBRIGATÓRIO DE DESENVOLVIMENTO

## REGRA PRINCIPAL

Nunca invente padrões.
Sempre siga os padrões existentes no código.

---

## ARQUITETURA

Monólito modular com camadas obrigatórias:

```
Controller → Service → Repository
```

- **Controller**: recebe a requisição, delega ao Service, retorna a resposta. Sem lógica de negócio.
- **Service**: contém toda a lógica de negócio. Sem acesso direto ao banco.
- **Repository**: único ponto de acesso ao banco de dados via Prisma.
- **Schema**: validação de entrada (Zod).

Proibido:
- Lógica de negócio no Controller
- Acesso direto ao banco fora do Repository
- Importar `prisma` fora de um Repository

---

## MULTITENANCY

- Toda entidade DEVE ter `tenant_id`
- Toda query DEVE filtrar por `tenant_id`
- O `tenant_id` vem **sempre** do middleware (nunca do body do request)
- Nunca retornar dados sem isolamento de tenant

```ts
// ✅ Correto
repo.findAll({ where: { tenant_id: tenantId } });

// ❌ Proibido
repo.findAll();
```

---

## TYPESCRIPT

- Strict mode **sempre** habilitado
- Proibido uso de `any` — use `unknown` e faça narrowing
- Todos os retornos de função devem ter tipo explícito
- Use os tipos de `packages/types` antes de criar novos

---

## SEGURANÇA

- Validar **todas** as entradas com Zod antes de processar
- Nunca confiar em dados do frontend sem validação
- Nunca expor stack traces para o cliente
- Senhas sempre com bcrypt (custo ≥ 12)
- Tokens JWT com expiração curta (≤ 1h); refresh token separado

---

## BANCO DE DADOS

- Apenas migrations gerenciadas pelo Prisma (`prisma migrate dev`)
- Nunca alterar o banco manualmente
- Nomes de tabelas e colunas em `snake_case`
- Toda tabela deve ter `id`, `created_at`, `updated_at` e `tenant_id`

---

## DOCKER

- Tudo deve rodar via Docker em produção
- Multi-stage build obrigatório nos Dockerfiles
- Nunca colocar segredos no Dockerfile ou docker-compose.yml — use `.env`

---

## UI (apps/web)

- Mobile-first, responsivo
- Usar o design system de `packages/ui` (baseado em shadcn/ui)
- Proibido estilo inline (`style={{...}}`) — use Tailwind
- Componentes de página em `app/`, componentes reutilizáveis em `components/`

---

## NOMENCLATURA

| Contexto       | Padrão      | Exemplo                  |
|----------------|-------------|--------------------------|
| Arquivos       | kebab-case  | `user.service.ts`        |
| Classes        | PascalCase  | `UserService`            |
| Funções/vars   | camelCase   | `createUser`             |
| Constantes     | UPPER_SNAKE | `MAX_RETRY_COUNT`        |
| Tabelas DB     | snake_case  | `tenant_users`           |

---

## REGRA DE BLOQUEIO

Se qualquer regra for violada:
1. **Não implementar**
2. Explicar qual regra seria violada
3. Sugerir a alternativa correta seguindo os padrões do projeto
