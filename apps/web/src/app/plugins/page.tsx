"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, PageHeader, Table } from "@fastconsig/ui";
import { controlPlaneApi, type ControlPlanePage } from "../../services/control-plane";
import { configApi, type ConfigItem } from "../../services/config";
import { ControlLayout } from "../control-layout";
import { useAuthSession } from "../use-auth-session";

interface PluginRow extends Record<string, unknown> {
  id: string;
  plugin: string;
  route: string;
  title: string;
}

interface PluginConfigRow extends Record<string, unknown> {
  id: string;
  key: string;
  scope: string;
  category: string;
  value: string;
}

function pluginNameFromKey(key: string): string {
  return key.split(".")[0] ?? key;
}

export default function PluginsPage(): JSX.Element {
  const session = useAuthSession();
  const [pages, setPages] = useState<ControlPlanePage[]>([]);
  const [configs, setConfigs] = useState<ConfigItem[]>([]);

  const load = useCallback(async (): Promise<void> => {
    if (!session) return;
    const [p, tenantConfig, systemConfig] = await Promise.all([
      controlPlaneApi.listPages(session.tenantId, session.accessToken),
      configApi.listTenant(session.tenantId, session.accessToken),
      configApi.listSystem(session.tenantId, session.accessToken),
    ]);
    setPages(p);
    setConfigs([...tenantConfig, ...systemConfig]);
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  const pageRows: PluginRow[] = pages.map((page) => ({
    id: page.key,
    plugin: pluginNameFromKey(page.key),
    route: page.route,
    title: page.title,
  }));

  const configRows: PluginConfigRow[] = configs.map((item) => ({
    id: `${item.scope}:${item.key}`,
    key: item.key,
    scope: item.scope,
    category: item.category,
    value: typeof item.value === "string" ? item.value : JSON.stringify(item.value),
  }));

  return (
    <ControlLayout>
      <PageHeader
        title="Gerenciamento de plugins"
        description="Visão dinâmica de páginas e configurações dos plugins habilitados."
        actions={<Button type="button" size="sm" onClick={() => void load()}>Recarregar</Button>}
      />

      <Table
        columns={[
          { key: "plugin", label: "Plugin" },
          { key: "title", label: "Tela" },
          { key: "route", label: "Rota" },
        ]}
        rows={pageRows}
        rowKey={(row) => row.id}
      />

      <Table
        columns={[
          { key: "key", label: "Configuração" },
          { key: "scope", label: "Escopo" },
          { key: "category", label: "Categoria" },
          { key: "value", label: "Valor" },
        ]}
        rows={configRows}
        rowKey={(row) => row.id}
      />
    </ControlLayout>
  );
}

