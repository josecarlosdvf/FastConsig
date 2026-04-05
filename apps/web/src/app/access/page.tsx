"use client";

import { useMemo } from "react";
import { PageHeader, Table } from "@fastconsig/ui";
import { ROLE_PERMISSIONS } from "@fastconsig/types";
import { ControlLayout } from "../control-layout";

interface AccessRow extends Record<string, unknown> {
  id: string;
  role: string;
  permissions: string;
}

export default function AccessPage(): JSX.Element {
  const rows = useMemo<AccessRow[]>(
    () =>
      Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => ({
        id: role,
        role,
        permissions: permissions.join(", "),
      })),
    []
  );

  return (
    <ControlLayout>
      <PageHeader
        title="Grupos, usuários e permissões"
        description="Matriz RBAC ativa no sistema (grupos/perfis e permissões efetivas)."
      />
      <Table
        columns={[
          { key: "role", label: "Grupo/Perfil" },
          { key: "permissions", label: "Permissões" },
        ]}
        rows={rows}
        rowKey={(row) => row.id}
      />
    </ControlLayout>
  );
}

