"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { CrudPage } from "@fastconsig/ui";
import { userApi } from "../../services/user";
import { ControlLayout } from "../control-layout";
import type { TableColumn } from "@fastconsig/ui";
import { useAuthSession } from "../use-auth-session";

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
  const session = useAuthSession();
  const [rows, setRows] = useState<UserCrudRow[]>([]);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (): Promise<void> => {
    if (!session) return;
    setError("");
    const result = await userApi.list(session.tenantId, session.accessToken);
    setRows(result.map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      role: item.role,
    })));
  }, [session]);

  useEffect(() => {
    load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Erro ao carregar usuários");
    });
  }, [load]);

  const columns = useMemo<Array<TableColumn<UserCrudRow>>>(
    () => [
      { key: "name", label: "Nome" },
      { key: "email", label: "Email" },
      { key: "role", label: "Perfil" },
    ],
    []
  );

  return (
    <ControlLayout>
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
          columns={columns}
          rowKey={(row) => row.id}
          onCreate={async (data) => {
            if (!session) return;
            await userApi.create(session.tenantId, session.accessToken, data);
            setFeedback("Usuário criado com sucesso.");
            await load();
          }}
          onDelete={async (row) => {
            if (!session) return;
            await userApi.remove(session.tenantId, session.accessToken, row.id);
            setFeedback("Usuário removido com sucesso.");
            await load();
          }}
          feedback={feedback}
          error={error}
        />
    </ControlLayout>
  );
}
