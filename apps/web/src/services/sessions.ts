import { api } from "./api";

export interface SessionItem {
  id: string;
  device_info?: string | null;
  ip_address?: string | null;
  last_used_at?: string | null;
  created_at: string;
  expires_at: string;
}

export const sessionsApi = {
  list: (tenantId: string, token: string): Promise<SessionItem[]> =>
    api.get<SessionItem[]>("/api/sessions", {
      tenantId,
      headers: { Authorization: `Bearer ${token}` },
    }),
  revoke: (tenantId: string, token: string, id: string): Promise<void> =>
    api.delete<void>(`/api/sessions/${id}`, {
      tenantId,
      headers: { Authorization: `Bearer ${token}` },
    }),
  revokeAll: (tenantId: string, token: string): Promise<void> =>
    api.delete<void>("/api/sessions", {
      tenantId,
      headers: { Authorization: `Bearer ${token}` },
    }),
};

