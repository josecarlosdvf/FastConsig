"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Container, CrudPage, Input } from "@fastconsig/ui";
import { userApi } from "../../services/user";
import { ControlLayout } from "../control-layout";

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
});

interface UserCrudRow extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
}

export default function UsersPage(): JSX.Element {
  const [tenantId, setTenantId] = useState("");
  const [token, setToken] = useState("");
  const [rows, setRows] = useState<UserCrudRow[]>([]);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function load(): Promise<void> {
    if (!tenantId || !token) return;
    setError("");
    const result = await userApi.list(tenantId, token);
    setRows(result.map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      role: item.role,
    })));
  }

  useEffect(() => {
    load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Erro ao carregar usuários");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, token]);

  const columns = useMemo(
    () => [
      { key: "name", label: "Nome" },
      { key: "email", label: "Email" },
      { key: "role", label: "Perfil" },
    ] as const,
    []
  );

  return (
    <ControlLayout>
      <Container size="lg">
        <Input label="Tenant ID" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
        <Input
          label="Access Token"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />

        <CrudPage
          title="Usuários"
          description="CRUD genérico via Schema + Table + RBAC"
          schema={userSchema}
          fields={{
            name: { label: "Nome", type: "text" },
            email: { label: "Email", type: "email" },
            password: { label: "Senha", type: "password" },
            role: {
              label: "Perfil",
              type: "select",
              options: [
                { value: "ADMIN", label: "Administrador" },
                { value: "MEMBER", label: "Membro" },
              ],
            },
          }}
          rows={rows}
          columns={columns as unknown as Array<{ key: keyof UserCrudRow & string; label: string }>}
          rowKey={(row) => row.id}
          onCreate={async (data) => {
            if (!tenantId || !token) return;
            await userApi.create(tenantId, token, data);
            setFeedback("Usuário criado com sucesso.");
            await load();
          }}
          onDelete={async (row) => {
            if (!tenantId || !token) return;
            await userApi.remove(tenantId, token, row.id);
            setFeedback("Usuário removido com sucesso.");
            await load();
          }}
          feedback={feedback}
          error={error}
        />
      </Container>
    </ControlLayout>
  );
}
