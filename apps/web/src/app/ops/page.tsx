"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, FormAlert, Input, PageHeader } from "@fastconsig/ui";
import { opsApi, type OpsSnapshot } from "../../services/ops";
import { ControlLayout } from "../control-layout";
import { useAuthSession } from "../use-auth-session";

export default function OpsPage(): JSX.Element {
  const session = useAuthSession();
  const [snapshot, setSnapshot] = useState<OpsSnapshot | null>(null);
  const [prometheus, setPrometheus] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (): Promise<void> => {
    if (!session) return;
    try {
      setError("");
      const result = await opsApi.observability(session.tenantId, session.accessToken);
      setSnapshot(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao carregar observabilidade.");
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ControlLayout>
      <PageHeader title="Operações" description="Observabilidade e métricas operacionais do sistema." />
      {error ? <FormAlert type="error" message={error} /> : null}
      <Input label="Média de resposta (ms)" value={String(snapshot?.metrics.avgResponseTimeMs ?? 0)} readOnly />
      <Input label="P95 (ms)" value={String(snapshot?.metrics.p95ResponseTimeMs ?? 0)} readOnly />
      <Input label="Eventos pendentes" value={String(snapshot?.durableEvents.pending ?? 0)} readOnly />
      <Input label="Eventos em dead-letter" value={String(snapshot?.durableEvents.deadLetter ?? 0)} readOnly />
      <Button
        type="button"
        onClick={() => void (async () => {
          if (!session) return;
          const text = await opsApi.prometheus(session.tenantId, session.accessToken);
          setPrometheus(text);
        })()}
      >
        Carregar Prometheus
      </Button>
      {prometheus ? <Input label="Prometheus (preview)" value={prometheus.slice(0, 200)} readOnly /> : null}
    </ControlLayout>
  );
}
