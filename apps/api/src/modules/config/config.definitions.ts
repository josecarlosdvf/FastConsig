import type { ConfigDefinition } from "@fastconsig/types";

export const BASE_CONFIG_DEFINITIONS: ConfigDefinition[] = [
  {
    key: "auth.session.timeout_seconds",
    label: "Tempo de sessão (segundos)",
    description: "Define a expiração padrão de sessão para usuários autenticados.",
    type: "number",
    scope: "tenant",
    category: "security",
    defaultValue: 3600,
  },
  {
    key: "auth.refresh.max_days",
    label: "Validade do refresh token (dias)",
    description: "Quantidade máxima de dias antes de exigir novo login.",
    type: "number",
    scope: "tenant",
    category: "auth",
    defaultValue: 7,
  },
  {
    key: "platform.maintenance.enabled",
    label: "Modo manutenção",
    description: "Quando habilitado, operações administrativas podem ser restritas.",
    type: "boolean",
    scope: "system",
    category: "ops",
    defaultValue: false,
  },
  {
    key: "platform.tenant_default_theme",
    label: "Tema padrão do tenant",
    description: "Tema inicial aplicado na criação de novos tenants.",
    type: "enum",
    scope: "system",
    category: "branding",
    defaultValue: "light",
    options: ["light", "dark"],
  },
];

