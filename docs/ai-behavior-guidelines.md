# Diretrizes de Comportamento para Agentes de IA (FastConsig)

## Objetivo
Padronizar como agentes de IA devem planejar, implementar, validar e publicar mudanças sem violar governança, segurança e isolamento multi-tenant.

## Regras obrigatórias
1. **Arquitetura fixa**: Controller → Service → Repository.
2. **Multitenancy obrigatória**: toda query com `tenant_id`.
3. **Sem Prisma fora de repository**.
4. **Sem `any`** e com retornos tipados.
5. **Validação de entrada com Zod** antes da lógica.
6. **RBAC explícito em rotas protegidas**.
7. **Sem delete físico** (`.delete` / `.deleteMany`).

## Fluxo de execução recomendado
1. Ler contexto do módulo e testes de arquitetura.
2. Executar baseline (lint/typecheck/test).
3. Planejar mudanças mínimas e incrementais.
4. Implementar por camada.
5. Rodar validações imediatamente após cada bloco.
6. Revisar segurança (dados, auth, tenant, eventos).
7. Documentar impacto técnico e operacional.

## Diretrizes para mudanças enterprise
- **Config**: sempre registrar versão e audit trail.
- **Eventos**: publicar no outbox durável; tratar retry e DLQ.
- **Observabilidade**: preservar `x-request-id`, `x-trace-id`, `x-span-id`.
- **Plugins**: respeitar limites e timeout de bootstrap.

## Checklist de entrega de IA
- [ ] Sem violações de arquitetura
- [ ] Tenant isolation validado
- [ ] RBAC validado
- [ ] Lint/typecheck/test executados
- [ ] Documentação atualizada
- [ ] Sem regressões de segurança
