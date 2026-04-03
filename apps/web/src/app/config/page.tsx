"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Container,
  Form,
  FormAlert,
  FormSection,
  Input,
  PageHeader,
} from "@fastconsig/ui";
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

  const filtered = useMemo(
    () => items.filter((item) => item.category === activeCategory),
    [items, activeCategory]
  );

  async function load(): Promise<void> {
    if (!tenantId || !token) return;
    setLoading(true);
    setError("");
    try {
      const result = scope === "tenant"
        ? await configApi.listTenant(tenantId, token)
        : await configApi.listSystem(tenantId, token);
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
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  async function save(): Promise<void> {
    if (!tenantId || !token) return;
    setLoading(true);
    setError("");
    setFeedback("");
    try {
      const payload = {
        entries: items.map((item) => ({
          key: item.key,
          value: parseValue(item.type, draft[item.key] ?? ""),
        })),
      };
      const result = scope === "tenant"
        ? await configApi.updateTenant(tenantId, token, payload)
        : await configApi.updateSystem(tenantId, token, payload);
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

      <Form onSubmit={(e) => { e.preventDefault(); void save(); }}>
        {filtered.map((item) => (
          <FormSection key={item.key} title={item.label} description={item.description ?? item.key}>
            <Input
              id={item.key}
              value={draft[item.key] ?? ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, [item.key]: e.target.value }))}
            />
          </FormSection>
        ))}
        <Button type="submit" isLoading={loading}>
          Salvar alterações
        </Button>
        {feedback ? <FormAlert type="success" message={feedback} /> : null}
        {error ? <FormAlert type="error" message={error} /> : null}
      </Form>
    </Container>
  );
}
