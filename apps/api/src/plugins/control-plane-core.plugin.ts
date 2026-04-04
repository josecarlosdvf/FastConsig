import { Plugin } from "@fastconsig/core";

export const controlPlaneCorePlugin: Plugin = {
  name: "control-plane-core",
  version: "0.1.0",
  description: "Core control-plane pages and permissions",
  permissions: [
    "config:read",
    "config:write",
    "user:read",
    "user:write",
    "user:delete",
    "audit:read",
    "event:read",
    "event:write",
  ],
  pages: [
    {
      key: "core.config",
      route: "/config",
      title: "Configurações",
      description: "Gerenciamento dinâmico de configurações",
      requiredPermissions: ["config:read"],
    },
    {
      key: "core.users",
      route: "/users",
      title: "Usuários",
      description: "CRUD de usuários com RBAC",
      requiredPermissions: ["user:read"],
    },
    {
      key: "core.audit",
      route: "/audit",
      title: "Audit Trail",
      description: "Trilha de auditoria persistente",
      requiredPermissions: ["audit:read"],
    },
    {
      key: "core.events",
      route: "/events",
      title: "Eventos",
      description: "DLQ e retries do event bus durável",
      requiredPermissions: ["event:read"],
    },
    {
      key: "core.ops",
      route: "/ops",
      title: "Operações",
      description: "Observabilidade avançada e saúde operacional",
      requiredPermissions: ["event:read"],
    },
  ],
  limits: {
    maxHooks: 20,
    maxConfigs: 120,
    maxPages: 30,
  },
  bootstrapTimeoutMs: 5000,
  register() {
    // No routes registered by this plugin. It only exposes declarative metadata.
  },
};
