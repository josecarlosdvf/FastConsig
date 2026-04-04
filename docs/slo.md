# SLOs de Produção — FastConsig

## Objetivo
Definir metas de confiabilidade para operação contínua do núcleo da plataforma.

## SLI/SLO definidos

### 1) Disponibilidade da API
- **SLI**: `1 - (5xx / total_requests)`
- **SLO**: **99.5% mensal**
- **Alertas**:
  - burn rápido: erro > 5% (5m)
  - burn lento: erro > 1% (1h)

### 2) Latência de respostas
- **SLI**: média de latência por rota
- **SLO**: média < **800ms** em janela de 15m
- **Alerta**: `FastConsigApiHighLatencyP95Approx`

### 3) Durabilidade de eventos
- **SLI**: backlog em dead-letter
- **SLO**: **DLQ = 0** sustentado
- **Alerta**: `FastConsigDeadLetterBacklog`

## Error budget (disponibilidade)
- SLO 99.5% => budget mensal de 0.5%
- Quando burn rápido/lento dispara:
  1. congelar deploys de risco
  2. abrir incidente
  3. executar runbook

## Fontes operacionais
- Grafana: `http://localhost:3002` (dashboard “FastConsig SRE Overview”)
- Prometheus: `http://localhost:9090`
- Alertmanager: `http://localhost:9093`
