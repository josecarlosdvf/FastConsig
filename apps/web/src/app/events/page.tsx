"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, FormAlert, PageHeader, Table } from "@fastconsig/ui";
import { eventsApi, type DeadLetterEvent } from "../../services/events";
import { ControlLayout } from "../control-layout";
import { useAuthSession } from "../use-auth-session";

interface EventRow extends Record<string, unknown> {
  id: string;
  event_name: string;
  attempts: number;
  max_attempts: number;
  updated_at: string;
}

export default function EventsPage(): JSX.Element {
  const session = useAuthSession();
  const [rows, setRows] = useState<DeadLetterEvent[]>([]);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async (): Promise<void> => {
    if (!session) return;
    try {
      setError("");
      const result = await eventsApi.listDeadLetter(session.tenantId, session.accessToken);
      setRows(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao carregar DLQ.");
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  const tableRows: EventRow[] = rows.map((row) => ({
    id: row.id,
    event_name: row.event_name,
    attempts: row.attempts,
    max_attempts: row.max_attempts,
    updated_at: new Date(row.updated_at).toLocaleString("pt-BR"),
  }));

  return (
    <ControlLayout>
      <PageHeader title="Eventos" description="DLQ e replay de eventos falhos." />
      {feedback ? <FormAlert type="success" message={feedback} /> : null}
      {error ? <FormAlert type="error" message={error} /> : null}
      <Table
        columns={[
          { key: "event_name", label: "Evento" },
          { key: "attempts", label: "Tentativas" },
          { key: "max_attempts", label: "Máximo" },
          { key: "updated_at", label: "Atualizado em" },
        ]}
        rows={tableRows}
        rowKey={(row) => row.id}
        actions={(row) => (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void (async () => {
              if (!session) return;
              await eventsApi.replayDeadLetter(session.tenantId, session.accessToken, row.id);
              setFeedback("Evento enviado para replay.");
              await load();
            })()}
          >
            Replay
          </Button>
        )}
      />
    </ControlLayout>
  );
}
