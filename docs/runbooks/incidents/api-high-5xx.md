# Runbook — API High 5xx

## Sinal
- Alerta `FastConsigApiHigh5xxRatio` ou burn de error budget.

## Diagnóstico rápido
1. Abrir dashboard SRE no Grafana.
2. Verificar rotas com maior erro em `fastconsig_http_route_errors_total`.
3. Verificar logs da API com `requestId/traceId`.
4. Confirmar saúde de DB/Redis/outbox.

## Mitigação imediata
1. Congelar deploys.
2. Reduzir tráfego em rotas críticas (rate limit/feature flag).
3. Reiniciar API apenas se houver leak/processo travado.

## Causa raiz
1. Correlacionar pico de erro com deploy/migration.
2. Validar timeout/dependências externas.
3. Verificar violação de tenant isolation/queries.

## Pós-incidente
1. Registrar timeline e impacto.
2. Criar ação preventiva (teste/alerta/safeguard).
3. Atualizar este runbook se necessário.
