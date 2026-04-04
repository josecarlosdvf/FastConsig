"use client";

import { useEffect, useState } from "react";
import { AppShell, Container, Navbar, Button, Input, Form } from "@fastconsig/ui";
import { useRouter } from "next/navigation";
import { controlPlaneApi, ControlPlanePage } from "../services/control-plane";

interface ControlLayoutProps {
  children: React.ReactNode;
}

export function ControlLayout({ children }: ControlLayoutProps): JSX.Element {
  const router = useRouter();
  const [tenantId, setTenantId] = useState("");
  const [token, setToken] = useState("");
  const [pages, setPages] = useState<ControlPlanePage[]>([]);

  useEffect(() => {
    if (!tenantId || !token) return;
    controlPlaneApi.listPages(tenantId, token).then(setPages).catch(() => setPages([]));
  }, [tenantId, token]);

  return (
    <AppShell
      sidebar={(
        <Container>
          <Form>
            <InputBlock label="Tenant ID" value={tenantId} onChange={setTenantId} />
            <InputBlock label="Token" value={token} onChange={setToken} type="password" />
          </Form>
          {pages.map((page) => (
            <Button key={page.key} variant="secondary" onClick={() => router.push(page.route)}>
              {page.title}
            </Button>
          ))}
        </Container>
      )}
    >
      <Navbar logo={<span>FastConsig Control Plane</span>} />
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
