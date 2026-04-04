# Guia Rápido do Orquestrador Humano

## 1) Como pedir planejamento
Use prompts com contexto e objetivo:

```text
Planeje a entrega de [feature] considerando:
- módulos afetados
- riscos de segurança
- validações necessárias
- critérios de aceite
```

## 2) Como pedir implementação
```text
Implemente [feature] no padrão Controller→Service→Repository,
com Zod, RBAC e tenant_id obrigatório.
```

## 3) Como pedir testes
```text
Implemente e rode testes unitários/integrados dos módulos alterados.
Execute lint e typecheck do workspace.
```

## 4) Como pedir rollout e produção
```text
Descreva plano de deploy com:
- migrações Prisma
- ordem de ativação
- rollback
- monitoramento pós-release
```

## 5) Prompt curto para demandas completas
```text
Planeje, implemente, teste e documente [feature],
seguindo governança FastConsig, com validação final completa.
```

## 6) Critérios de aceite recomendados
- Entrega por camadas e multi-tenant
- Sem violações de arquitetura
- Testes e lint/typecheck verdes
- Documentação de operação e rollback
- Evidência de segurança e observabilidade

## 7) Prompt pronto para observabilidade de produção
```text
Monte stack de produção com Grafana + Prometheus + Alertmanager,
incluindo:
- dashboards provisionados
- SLOs e alertas
- runbooks de incidentes
- validação final de build/typecheck/test
e finalize com versão fechada para evolução de CRM/ERP.
```
