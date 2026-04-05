"use client";

import { useEffect, useState } from "react";
import { AppShell, Container, Navbar, Button, Input, Form } from "@fastconsig/ui";
import { useRouter } from "next/navigation";
import { controlPlaneApi, ControlPlanePage } from "../services/control-plane";
import { authApi } from "../services/auth";
import {
  clearSession,
  readSession,
  readTheme,
  setTheme,
  type SessionState,
} from "../services/session-client";

interface ControlLayoutProps {
  children: React.ReactNode;
}

export function ControlLayout({ children }: ControlLayoutProps): JSX.Element {
  const router = useRouter();
  const [session, setSession] = useState<SessionState | null>(null);
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("system");
  const [pages, setPages] = useState<ControlPlanePage[]>([]);
  const [manualTenant, setManualTenant] = useState("");
  const [manualToken, setManualToken] = useState("");

  useEffect(() => {
    const current = readSession();
    if (!current) {
      router.replace("/login");
      return;
    }
    setSession(current);
    setManualTenant(current.tenantId);
    setManualToken(current.accessToken);
    const currentTheme = readTheme();
    setThemeMode(currentTheme);
    setTheme(currentTheme);
  }, [router]);

  useEffect(() => {
    if (!session) return;
    controlPlaneApi
      .listPages(session.tenantId, session.accessToken)
      .then(setPages)
      .catch(() => {
        clearSession();
        router.replace("/login");
      });
  }, [router, session]);

  if (!session) {
    return (
      <Container size="sm">
        <Form title="Carregando sessão">
          <Input label="Status" value="Validando autenticação..." readOnly />
        </Form>
      </Container>
    );
  }

  async function logout(): Promise<void> {
    const current = session;
    if (!current) return;
    try {
      await authApi.logout(current.tenantId, current.refreshToken);
    } catch {
      // noop
    } finally {
      clearSession();
      router.replace("/login");
    }
  }

  const quickLinks: Array<{ route: string; title: string }> = [
    { route: "/sessions", title: "Sessões" },
    { route: "/access", title: "Acessos" },
    { route: "/plugins", title: "Plugins" },
  ];

  return (
    <AppShell
      sidebar={(
        <Container>
          <Form>
            <InputBlock label="Tenant ID" value={manualTenant} onChange={setManualTenant} />
            <InputBlock label="Token" value={manualToken} onChange={setManualToken} type="password" />
            <Input label="Usuário" value={session.user.email} readOnly />
          </Form>
          {quickLinks.map((page) => (
            <Button key={page.route} variant="secondary" onClick={() => router.push(page.route)}>
              {page.title}
            </Button>
          ))}
          {pages.map((page) => (
            <Button key={page.key} variant="secondary" onClick={() => router.push(page.route)}>
              {page.title}
            </Button>
          ))}
        </Container>
      )}
    >
      <Navbar
        logo={<span>FastConsig Control Plane</span>}
        actions={(
          <>
            <Button
              variant={themeMode === "light" ? "primary" : "secondary"}
              size="sm"
              onClick={() => {
                setThemeMode("light");
                setTheme("light");
              }}
            >
              Claro
            </Button>
            <Button
              variant={themeMode === "dark" ? "primary" : "secondary"}
              size="sm"
              onClick={() => {
                setThemeMode("dark");
                setTheme("dark");
              }}
            >
              Escuro
            </Button>
            <Button
              variant={themeMode === "system" ? "primary" : "secondary"}
              size="sm"
              onClick={() => {
                setThemeMode("system");
                setTheme("system");
              }}
            >
              Sistema
            </Button>
            <Button variant="danger" size="sm" onClick={() => void logout()}>
              Sair
            </Button>
          </>
        )}
      />
      <Container>{children}</Container>
    </AppShell>
  );
}

interface InputBlockProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}

function InputBlock({ label, value, onChange, type = "text" }: InputBlockProps): JSX.Element {
  return (
    <Input label={label} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
  );
}
