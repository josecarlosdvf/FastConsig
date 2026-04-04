# Runbook — API High Latency

## Sinal
- Alerta `FastConsigApiHighLatencyP95Approx`.

## Diagnóstico rápido
1. Identificar rotas mais lentas (`fastconsig_http_route_duration_avg_ms`).
2. Verificar backlog no outbox e pool de DB.
3. Conferir latência de Redis e consultas Prisma.

## Mitigação imediata
1. Escalar réplicas API (se aplicável).
2. Reduzir operações pesadas não críticas.
3. Ajustar timeouts e retentativas agressivas.

## Causa raiz
1. Identificar regressão por release recente.
2. Checar queries sem índices adequados.
3. Auditar gargalos em filas/eventos.

## Pós-incidente
1. Criar teste de performance para rota afetada.
2. Ajustar SLO/alerta se necessário.
