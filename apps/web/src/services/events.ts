import { api } from "./api";

export interface DeadLetterEvent {
  id: string;
  tenant_id: string | null;
  event_name: string;
  payload: Record<string, unknown>;
  status: "DEAD_LETTER" | "FAILED" | "PENDING" | "PROCESSING" | "DELIVERED";
  attempts: number;
  max_attempts: number;
  last_error?: string | null;
  created_at: string;
  updated_at: string;
}

export const eventsApi = {
  listDeadLetter: (tenantId: string, token: string): Promise<DeadLetterEvent[]> =>
    api.get<DeadLetterEvent[]>("/api/events/dead-letter", {
      tenantId,
      headers: { Authorization: `Bearer ${token}` },
    }),
  replayDeadLetter: (tenantId: string, token: string, id: string): Promise<void> =>
    api.patch<void>("/api/events/dead-letter/replay", { id }, {
      tenantId,
      headers: { Authorization: `Bearer ${token}` },
    }),
};

