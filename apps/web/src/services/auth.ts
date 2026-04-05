import { api } from "./api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export const authApi = {
  login: (tenantId: string, email: string, password: string): Promise<AuthTokens> =>
    api.post<AuthTokens>(
      "/api/auth/login",
      { email, password },
      { tenantId }
    ),
  refresh: (tenantId: string, refreshToken: string): Promise<AuthTokens> =>
    api.post<AuthTokens>(
      "/api/auth/refresh",
      { refreshToken },
      { tenantId }
    ),
  logout: (tenantId: string, refreshToken: string): Promise<void> =>
    api.post<void>(
      "/api/auth/logout",
      { refreshToken },
      { tenantId }
    ),
};

