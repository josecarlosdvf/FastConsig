"use client";

import type { AuthUser } from "./auth";

export interface SessionState {
  tenantId: string;
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

const SESSION_STORAGE_KEY = "fastconsig.session";
const THEME_STORAGE_KEY = "fastconsig.theme";

export function readSession(): SessionState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionState;
    if (!parsed.tenantId || !parsed.accessToken || !parsed.refreshToken || !parsed.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: SessionState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function readTheme(): "light" | "dark" | "system" {
  if (typeof window === "undefined") return "system";
  const theme = localStorage.getItem(THEME_STORAGE_KEY);
  if (theme === "light" || theme === "dark" || theme === "system") return theme;
  return "system";
}

export function setTheme(mode: "light" | "dark" | "system"): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  const setter = (window as Window & { __fastconsigSetTheme?: (value: "light" | "dark" | "system") => void })
    .__fastconsigSetTheme;
  if (setter) setter(mode);
}

