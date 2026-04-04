import { api } from "./api";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: "ADMIN" | "MEMBER";
}

export const userApi = {
  list: (tenantId: string, token: string): Promise<UserRow[]> =>
    api.get<UserRow[]>("/api/users", {
      tenantId,
      headers: { Authorization: `Bearer ${token}` },
    }),

  create: (
    tenantId: string,
    token: string,
    payload: CreateUserInput
  ): Promise<UserRow> =>
    api.post<UserRow>("/api/users", payload, {
      tenantId,
      headers: { Authorization: `Bearer ${token}` },
    }),

  remove: (tenantId: string, token: string, id: string): Promise<void> =>
    api.delete<void>(`/api/users/${id}`, {
      tenantId,
      headers: { Authorization: `Bearer ${token}` },
    }),
};
