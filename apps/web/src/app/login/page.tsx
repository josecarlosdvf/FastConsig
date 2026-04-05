"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button, Container, Form, FormAlert, Input, PageHeader } from "@fastconsig/ui";
import { authApi } from "../../services/auth";
import { saveSession } from "../../services/session-client";

const loginSchema = z.object({
  tenantId: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(1),
});

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const [tenantId, setTenantId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(): Promise<void> {
    setError("");
    const validation = loginSchema.safeParse({ tenantId, email, password });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.login(tenantId, email, password);
      saveSession({
        tenantId,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
      router.replace("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha no login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container size="sm">
      <PageHeader
        title="Login"
        description="Acesse o control-plane com tenant e credenciais válidas."
      />
      <Form>
        <Input label="Tenant ID" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
        <Input
          label="E-mail"
          type="email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Senha"
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="button" isLoading={loading} onClick={() => void submit()}>
          Entrar
        </Button>
        {error ? <FormAlert type="error" message={error} /> : null}
      </Form>
    </Container>
  );
}

