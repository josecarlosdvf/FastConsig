"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Container,
  Form,
  FormAlert,
  Input,
  PageHeader,
  SchemaForm,
} from "@fastconsig/ui";
import { z } from "zod";
import { configApi, ConfigItem } from "../../services/config";

type Category = ConfigItem["category"];
const categories: Category[] = ["security", "auth", "platform", "branding", "ops"];

function toText(value: ConfigItem["value"]): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return JSON.stringify(value);
}

function parseValue(type: ConfigItem["type"], raw: string): ConfigItem["value"] {
  if (type === "number") return Number(raw);
  if (type === "boolean") return raw === "true";
  if (type === "json") return JSON.parse(raw) as Record<string, unknown>;
  return raw;
}

export default function ConfigPage(): JSX.Element {
  const [tenantId, setTenantId] = useState("");
  const [token, setToken] = useState("");
  const [scope, setScope] = useState<"tenant" | "system">("tenant");
  const [activeCategory, setActiveCategory] = useState<Category>("security");
  const [items, setItems] = useState<ConfigItem[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const filtered = useMemo(
    () => items.filter((item) => item.category === activeCategory),
    [items, activeCategory]
  );

  async function listByScope(
    currentScope: "tenant" | "system",
    currentTenantId: string,
    currentToken: string
  ): Promise<ConfigItem[]> {
    if (currentScope === "tenant") {
      return configApi.listTenant(currentTenantId, currentToken);
    }
    return configApi.listSystem(currentTenantId, currentToken);
  }

  async function updateByScope(
    currentScope: "tenant" | "system",
    currentTenantId: string,
    currentToken: string,
    payload: { entries: Array<{ key: string; value: ConfigItem["value"] }> }
  ): Promise<ConfigItem[]> {
    if (currentScope === "tenant") {
      return configApi.updateTenant(currentTenantId, currentToken, payload);
    }
    return configApi.updateSystem(currentTenantId, currentToken, payload);
  }

  async function load(): Promise<void> {
    if (!tenantId || !token) return;
    setLoading(true);
    setError("");
    try {
      const result = await listByScope(scope, tenantId, token);
      setItems(result);
      const nextDraft: Record<string, string> = {};
      for (const item of result) {
        nextDraft[item.key] = toText(item.value);
      }
      setDraft(nextDraft);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch((err: unknown) => {
      const message = err instanceof Error ? err.message : "Falha ao carregar configurações.";
      setError(message);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  async function saveSingle(item: ConfigItem, rawValue: string): Promise<void> {
    if (!tenantId || !token) return;
    setLoading(true);
    setError("");
    setFeedback("");
    try {
      const payload = {
        entries: [{ key: item.key, value: parseValue(item.type, rawValue) }],
      };
      const result = await updateByScope(scope, tenantId, token, payload);
      setItems(result);
      setFeedback("Configurações salvas com sucesso.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container size="lg">
      <PageHeader
        title="Control Plane • Configuração"
        description="Engine de configuração dinâmica por escopo e categoria."
      />
      <Form>
        <Input
          id="tenant-id"
          label="Tenant ID"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
        />
        <Input
          id="token"
          label="Access Token (JWT)"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <Button type="button" variant={scope === "tenant" ? "primary" : "secondary"} onClick={() => setScope("tenant")}>
          Tenant
        </Button>
        <Button type="button" variant={scope === "system" ? "primary" : "secondary"} onClick={() => setScope("system")}>
          System
        </Button>
        <Button type="button" onClick={() => void load()} isLoading={loading}>
          Carregar
        </Button>
      </Form>

      <Form>
        {categories.map((category) => (
          <Button
            key={category}
            type="button"
            size="sm"
            variant={activeCategory === category ? "primary" : "secondary"}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </Button>
        ))}
      </Form>

      <Form>
        {filtered.map((item) => (
          <Form key={item.key} title={item.label} description={item.description ?? item.key}>
            <Input
              id={`${item.key}-preview`}
              label={item.key}
              value={draft[item.key] ?? ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, [item.key]: e.target.value }))}
            />
            <Button type="button" size="sm" onClick={() => setEditingKey(item.key)}>
              Editar por schema
            </Button>
            {editingKey === item.key ? (
              <SchemaForm
                schema={z.object({
                  value: z.string().min(1),
                })}
                title={`Editar ${item.label}`}
                description="Fluxo de edição guiado por schema (Zod)"
                fields={{
                  value: {
                    label: "Valor",
                    type: "text",
                  },
                }}
                defaultValues={{
                  value: draft[item.key] ?? "",
                }}
                submitLabel="Salvar este campo"
                onSubmit={async (data) => {
                  await saveSingle(item, data.value);
                  setDraft((prev) => ({ ...prev, [item.key]: data.value }));
                  setEditingKey(null);
                }}
              />
            ) : null}
          </Form>
        ))}
        {feedback ? <FormAlert type="success" message={feedback} /> : null}
        {error ? <FormAlert type="error" message={error} /> : null}
      </Form>
    </Container>
  );
}
