# Runbook — Event DLQ Backlog

## Sinal
- Alerta `FastConsigDeadLetterBacklog`.

## Diagnóstico rápido
1. Consultar `/api/events/dead-letter`.
2. Agrupar por `event_name` e `last_error`.
3. Confirmar disponibilidade de Redis e handlers.

## Mitigação imediata
1. Corrigir causa do erro no consumidor/handler.
2. Reprocessar itens via endpoint de replay.
3. Monitorar fila até zerar DLQ.

## Causa raiz
1. Validar payload incompatível com handler.
2. Verificar timeout/falha de dependência externa.
3. Avaliar limite de retry e backoff.

## Pós-incidente
1. Adicionar validação preventiva no produtor.
2. Criar teste para evento falho recorrente.
3. Atualizar thresholds de alerta, se necessário.
