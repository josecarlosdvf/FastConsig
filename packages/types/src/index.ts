export type { UserRole, Permission } from "./permissions";
export { ROLE_PERMISSIONS } from "./permissions";

import type { UserRole } from "./permissions";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Pick<User, "id" | "name" | "email" | "role">;
}

export interface ApiError {
  error: string;
  issues?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}
