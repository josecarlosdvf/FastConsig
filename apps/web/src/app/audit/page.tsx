"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Form, FormAlert, Input, PageHeader, Table } from "@fastconsig/ui";
import { auditApi, type AuditEntry } from "../../services/audit";
import { ControlLayout } from "../control-layout";
import { useAuthSession } from "../use-auth-session";

interface AuditRow extends Record<string, unknown> {
  id: string;
  event_name: string;
  actor_user_id: string;
  created_at: string;
}

export default function AuditPage(): JSX.Element {
  const session = useAuthSession();
  const [eventName, setEventName] = useState("");
  const [limit, setLimit] = useState("100");
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async (): Promise<void> => {
    if (!session) return;
    try {
      setError("");
      const result = await auditApi.list(session.tenantId, session.accessToken, {
        eventName: eventName || undefined,
        limit: Number(limit) || 100,
      });
      setRows(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao carregar auditoria.");
    }
  }, [eventName, limit, session]);

  useEffect(() => {
    void load();
  }, [load]);

  const tableRows: AuditRow[] = rows.map((row) => ({
    id: row.id,
    event_name: row.event_name,
    actor_user_id: row.actor_user_id ?? "-",
    created_at: new Date(row.created_at).toLocaleString("pt-BR"),
  }));

  return (
    <ControlLayout>
      <PageHeader title="Audit Trail" description="Consulta e rastreabilidade dos eventos auditáveis." />
      <Form>
        <Input label="Evento" value={eventName} onChange={(e) => setEventName(e.target.value)} />
        <Input label="Limite" type="number" value={limit} onChange={(e) => setLimit(e.target.value)} />
        <Button type="button" onClick={() => void load()}>
          Filtrar
        </Button>
      </Form>
      {error ? <FormAlert type="error" message={error} /> : null}
      <Table
        columns={[
          { key: "event_name", label: "Evento" },
          { key: "actor_user_id", label: "Usuário" },
          { key: "created_at", label: "Data/Hora" },
        ]}
        rows={tableRows}
        rowKey={(row) => row.id}
      />
    </ControlLayout>
  );
}

