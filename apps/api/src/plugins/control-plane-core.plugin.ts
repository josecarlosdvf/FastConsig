import { Plugin } from "@fastconsig/core";

export const controlPlaneCorePlugin: Plugin = {
  name: "control-plane-core",
  version: "0.1.0",
  description: "Core control-plane pages and permissions",
  permissions: ["config:read", "config:write", "user:read", "user:write", "user:delete"],
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
  ],
  register() {
    // No routes registered by this plugin. It only exposes declarative metadata.
  },
};
