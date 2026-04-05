import { api } from "./api";

export interface AuditEntry {
  id: string;
  tenant_id: string;
  event_name: string;
  actor_user_id?: string | null;
  trace_id?: string | null;
  request_id?: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

interface AuditListQuery {
  eventName?: string;
  from?: string;
  to?: string;
  limit?: number;
}

function toQueryString(query: AuditListQuery): string {
  const params = new URLSearchParams();
  if (query.eventName) params.set("eventName", query.eventName);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (typeof query.limit === "number") params.set("limit", String(query.limit));
  const text = params.toString();
  return text ? `?${text}` : "";
}

export const auditApi = {
  list: (
    tenantId: string,
    token: string,
    query: AuditListQuery = {}
  ): Promise<AuditEntry[]> =>
    api.get<AuditEntry[]>(`/api/audit/${toQueryString(query)}`, {
      tenantId,
      headers: { Authorization: `Bearer ${token}` },
    }),
};

