import { Plugin } from "@fastconsig/core";

export const learningSystemPlugin: Plugin = {
  name: "learning-system",
  version: "0.1.0",
  description: "Tutoriais guiados, focos de tela e wizards de onboarding para UIs",
  permissions: ["learning:read", "learning:write", "config:read", "config:write"],
  configs: [
    {
      key: "learning.enabled",
      label: "Habilitar sistema de aprendizado",
      description: "Ativa tutoriais, dicas contextuais e jornadas guiadas no tenant.",
      type: "boolean",
      scope: "tenant",
      category: "platform",
      defaultValue: true,
    },
    {
      key: "learning.onboarding.auto_start",
      label: "Auto iniciar onboarding",
      description: "Inicia automaticamente o fluxo guiado no primeiro acesso.",
      type: "boolean",
      scope: "tenant",
      category: "platform",
      defaultValue: true,
    },
    {
      key: "learning.overlay.opacity",
      label: "Opacidade do overlay",
      description: "Define a opacidade do fundo esmaecido durante focos e tours.",
      type: "number",
      scope: "tenant",
      category: "branding",
      defaultValue: 0.6,
    },
    {
      key: "learning.content.locale",
      label: "Idioma padrão do conteúdo",
      description: "Define o idioma principal dos tutoriais e wizards.",
      type: "enum",
      scope: "tenant",
      category: "platform",
      defaultValue: "pt-BR",
      options: ["pt-BR", "en-US", "es-ES"],
    },
    {
      key: "learning.release_whats_new.enabled",
      label: "Exibir novidades de atualização",
      description: "Mostra jornadas de novidades sempre que novas features forem publicadas.",
      type: "boolean",
      scope: "tenant",
      category: "ops",
      defaultValue: true,
    },
  ],
  pages: [
    {
      key: "learning.tutorials",
      route: "/learning/tutorials",
      title: "Tutoriais",
      description: "Cadastro e gestão de tutoriais por módulo e recurso.",
      requiredPermissions: ["learning:read"],
    },
    {
      key: "learning.wizards",
      route: "/learning/wizards",
      title: "Wizards",
      description: "Criação de fluxos guiados de onboarding e operação assistida.",
      requiredPermissions: ["learning:read"],
    },
    {
      key: "learning.releases",
      route: "/learning/releases",
      title: "Novidades",
      description: "Gestão de tours para updates e mudanças relevantes da plataforma.",
      requiredPermissions: ["learning:read"],
    },
  ],
  limits: {
    maxHooks: 10,
    maxConfigs: 80,
    maxPages: 25,
  },
  bootstrapTimeoutMs: 5000,
  register() {
    // Declarative plugin for control-plane catalog and config registry.
  },
};
