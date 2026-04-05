"use client";

import { useMemo, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FormAlert, PageHeader, Table } from "@fastconsig/ui";
import { ControlLayout } from "../control-layout";
import { useAuthSession } from "../use-auth-session";
import { controlPlaneApi, type ControlPlanePage } from "../../services/control-plane";
import { configApi, type ConfigItem } from "../../services/config";

interface ConfigRow extends Record<string, unknown> {
  id: string;
  key: string;
  scope: string;
  category: string;
  value: string;
}

function pluginPrefixFromPage(page: ControlPlanePage): string {
  return page.key.split(".")[0] ?? "";
}

export default function DynamicControlPlanePage(): JSX.Element {
  const session = useAuthSession();
  const pathname = usePathname();
  const [pages, setPages] = useState<ControlPlanePage[]>([]);
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    Promise.all([
      controlPlaneApi.listPages(session.tenantId, session.accessToken),
      configApi.listTenant(session.tenantId, session.accessToken),
      configApi.listSystem(session.tenantId, session.accessToken),
    ])
      .then(([catalogPages, tenantConfig, systemConfig]) => {
        setPages(catalogPages);
        setConfigs([...tenantConfig, ...systemConfig]);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Falha ao carregar página dinâmica.");
      });
  }, [session]);

  const current = useMemo(
    () => pages.find((item) => item.route === pathname),
    [pages, pathname]
  );

  const pluginPrefix = current ? pluginPrefixFromPage(current) : "";
  const filteredConfigs = useMemo(() => {
    if (!pluginPrefix) return [];
    return configs.filter((item) => item.key.startsWith(`${pluginPrefix}.`));
  }, [configs, pluginPrefix]);

  const tableRows: ConfigRow[] = filteredConfigs.map((item) => ({
    id: `${item.scope}:${item.key}`,
    key: item.key,
    scope: item.scope,
    category: item.category,
    value: typeof item.value === "string" ? item.value : JSON.stringify(item.value),
  }));

  return (
    <ControlLayout>
      <PageHeader
        title={current?.title ?? "Tela dinâmica"}
        description={
          current?.description
          ?? "Tela declarada por plugin no control-plane, renderizada dinamicamente."
        }
      />
      {error ? <FormAlert type="error" message={error} /> : null}
      {current ? (
        <Table
          columns={[
            { key: "key", label: "Configuração" },
            { key: "scope", label: "Escopo" },
            { key: "category", label: "Categoria" },
            { key: "value", label: "Valor atual" },
          ]}
          rows={tableRows}
          rowKey={(row) => row.id}
        />
      ) : (
        <FormAlert type="warning" message="A página não está disponível para o seu perfil." />
      )}
    </ControlLayout>
  );
}

