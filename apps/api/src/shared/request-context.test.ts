import { requestContext, getContext, runWithContext } from "@fastconsig/core";

describe("RequestContext", () => {
  it("deve retornar undefined fora de um contexto", () => {
    expect(getContext()).toBeUndefined();
  });

  it("deve retornar o contexto dentro de runWithContext", () => {
    const ctx = { requestId: "req-1", tenantId: "tenant-a" };

    runWithContext(ctx, () => {
      expect(getContext()).toEqual(ctx);
    });
  });

  it("contextos aninhados devem ser independentes", () => {
    const outer = { requestId: "outer", tenantId: "t-outer" };
    const inner = { requestId: "inner", tenantId: "t-inner" };

    runWithContext(outer, () => {
      expect(getContext()?.requestId).toBe("outer");

      runWithContext(inner, () => {
        expect(getContext()?.requestId).toBe("inner");
      });

      // Back to outer scope
      expect(getContext()?.requestId).toBe("outer");
    });
  });

  it("mutação do contexto deve ser visível dentro do mesmo escopo assíncrono", async () => {
    const ctx = { requestId: "req-mut" };

    await new Promise<void>((resolve) => {
      runWithContext(ctx, async () => {
        const stored = getContext()!;
        expect(stored.tenantId).toBeUndefined();

        await Promise.resolve(); // simulate async middleware

        stored.tenantId = "t-mutated";

        await Promise.resolve(); // simulate another tick

        expect(getContext()?.tenantId).toBe("t-mutated");
        resolve();
      });
    });
  });

  it("deve isolar contextos de requisições concorrentes", async () => {
    const results: Array<{ req: string; tenant?: string }> = [];

    const simulateRequest = (requestId: string, tenantId: string) =>
      new Promise<void>((resolve) => {
        runWithContext({ requestId }, async () => {
          await new Promise((r) => setTimeout(r, Math.random() * 10));
          const ctx = getContext()!;
          ctx.tenantId = tenantId;
          await new Promise((r) => setTimeout(r, Math.random() * 10));
          results.push({ req: requestId, tenant: getContext()?.tenantId });
          resolve();
        });
      });

    await Promise.all([
      simulateRequest("req-A", "tenant-A"),
      simulateRequest("req-B", "tenant-B"),
      simulateRequest("req-C", "tenant-C"),
    ]);

    // Each request should see only its own tenant
    expect(results.find((r) => r.req === "req-A")?.tenant).toBe("tenant-A");
    expect(results.find((r) => r.req === "req-B")?.tenant).toBe("tenant-B");
    expect(results.find((r) => r.req === "req-C")?.tenant).toBe("tenant-C");
  });

  it("não deve vazar contexto entre testes", () => {
    // This test runs AFTER the ones above. Context should not bleed.
    expect(requestContext.getStore()).toBeUndefined();
  });
});
