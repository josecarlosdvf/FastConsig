import { Plugin } from "@fastconsig/core";

export const monetizationPaymentsPlugin: Plugin = {
  name: "monetization-payments",
  version: "0.1.0",
  description: "Integrações e governança de pagamentos via PIX, cartão de crédito e débito",
  permissions: ["billing:read", "billing:write", "license:read", "config:read", "config:write"],
  configs: [
    {
      key: "payments.pix.enabled",
      label: "PIX habilitado",
      description: "Permite gerar cobranças e QR Code PIX para assinaturas.",
      type: "boolean",
      scope: "system",
      category: "platform",
      defaultValue: true,
    },
    {
      key: "payments.card.enabled",
      label: "Cartão habilitado",
      description: "Permite cobrança via cartão de crédito e débito.",
      type: "boolean",
      scope: "system",
      category: "platform",
      defaultValue: true,
    },
    {
      key: "payments.retry.max_attempts",
      label: "Tentativas máximas de cobrança",
      description: "Quantidade máxima de retentativas automáticas em falha de pagamento.",
      type: "number",
      scope: "system",
      category: "ops",
      defaultValue: 3,
    },
    {
      key: "payments.qr.expiration_minutes",
      label: "Expiração do QR PIX (min)",
      description: "Tempo de expiração de QR Code PIX gerado para uma cobrança.",
      type: "number",
      scope: "system",
      category: "security",
      defaultValue: 30,
    },
    {
      key: "payments.webhook.signature_required",
      label: "Assinatura de webhook obrigatória",
      description: "Exige validação criptográfica em notificações de gateway de pagamento.",
      type: "boolean",
      scope: "system",
      category: "security",
      defaultValue: true,
    },
  ],
  pages: [
    {
      key: "payments.methods",
      route: "/monetization/payments/methods",
      title: "Métodos de Pagamento",
      description: "Gestão de métodos disponíveis para aquisição e renovação.",
      requiredPermissions: ["billing:read"],
    },
    {
      key: "payments.transactions",
      route: "/monetization/payments/transactions",
      title: "Transações",
      description: "Visão operacional de cobranças PIX e cartão com status por tenant.",
      requiredPermissions: ["billing:read"],
    },
    {
      key: "payments.reconciliation",
      route: "/monetization/payments/reconciliation",
      title: "Conciliação",
      description: "Conciliação de recebíveis e inconsistências de liquidação.",
      requiredPermissions: ["billing:read"],
    },
  ],
  limits: {
    maxHooks: 15,
    maxConfigs: 90,
    maxPages: 20,
  },
  bootstrapTimeoutMs: 5000,
  register() {
    // Declarative plugin for payment operations and controls.
  },
};
