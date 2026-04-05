"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, FormAlert, PageHeader, Table } from "@fastconsig/ui";
import { sessionsApi, type SessionItem } from "../../services/sessions";
import { ControlLayout } from "../control-layout";
import { useAuthSession } from "../use-auth-session";

interface SessionRow extends Record<string, unknown> {
  id: string;
  device_info: string;
  ip_address: string;
  created_at: string;
  expires_at: string;
}

export default function SessionsPage(): JSX.Element {
  const session = useAuthSession();
  const [rows, setRows] = useState<SessionItem[]>([]);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async (): Promise<void> => {
    if (!session) return;
    try {
      setError("");
      const result = await sessionsApi.list(session.tenantId, session.accessToken);
      setRows(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao carregar sessões.");
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  const tableRows: SessionRow[] = rows.map((row) => ({
    id: row.id,
    device_info: row.device_info ?? "-",
    ip_address: row.ip_address ?? "-",
    created_at: new Date(row.created_at).toLocaleString("pt-BR"),
    expires_at: new Date(row.expires_at).toLocaleString("pt-BR"),
  }));

  return (
    <ControlLayout>
      <PageHeader title="Sessões" description="Gerencie sessões ativas do usuário logado." />
      <Button
        type="button"
        variant="danger"
        onClick={() => void (async () => {
          if (!session) return;
          await sessionsApi.revokeAll(session.tenantId, session.accessToken);
          setFeedback("Todas as sessões revogadas.");
          await load();
        })()}
      >
        Revogar todas
      </Button>
      {feedback ? <FormAlert type="success" message={feedback} /> : null}
      {error ? <FormAlert type="error" message={error} /> : null}
      <Table
        columns={[
          { key: "device_info", label: "Dispositivo" },
          { key: "ip_address", label: "IP" },
          { key: "created_at", label: "Criada em" },
          { key: "expires_at", label: "Expira em" },
        ]}
        rows={tableRows}
        rowKey={(row) => row.id}
        actions={(row) => (
          <Button
            variant="danger"
            size="sm"
            onClick={() => void (async () => {
              if (!session) return;
              await sessionsApi.revoke(session.tenantId, session.accessToken, row.id);
              setFeedback("Sessão revogada.");
              await load();
            })()}
          >
            Revogar
          </Button>
        )}
      />
    </ControlLayout>
  );
}
