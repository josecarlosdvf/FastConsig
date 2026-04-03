import {
  scopeOperation,
  injectTenantWhere,
  injectTenantCreate,
  OperationContext,
} from "../../shared/database/tenant-prisma";

const TENANT_A = "tenant-aaa";
const TENANT_B = "tenant-bbb";

describe("Tenant Isolation — tenant-prisma helpers", () => {
  describe("injectTenantWhere", () => {
    it("deve adicionar tenant_id ao where quando não há filtros", () => {
      const result = injectTenantWhere({}, TENANT_A);
      expect(result.where).toEqual({ tenant_id: TENANT_A });
    });

    it("deve preservar filtros existentes e sobrescrever tenant_id", () => {
      const result = injectTenantWhere({ where: { is_active: true } }, TENANT_A);
      expect(result.where).toEqual({ is_active: true, tenant_id: TENANT_A });
    });

    it("tenant_id de um tenant não pode ser substituído por outro tenant", () => {
      // Tenant B tenta injetar seu próprio tenant_id
      const args = { where: { tenant_id: TENANT_B } };
      const result = injectTenantWhere(args, TENANT_A);
      // O scoped client deve substituir tenant_id pelo tenantId do client
      expect(result.where?.tenant_id).toBe(TENANT_A);
    });
  });

  describe("injectTenantCreate", () => {
    it("deve adicionar tenant_id ao data em create", () => {
      const result = injectTenantCreate({ data: { name: "test" } }, TENANT_A);
      expect((result.data as Record<string, unknown>).tenant_id).toBe(TENANT_A);
    });

    it("deve adicionar tenant_id a cada registro em createMany", () => {
      const result = injectTenantCreate(
        { data: [{ name: "a" }, { name: "b" }] },
        TENANT_A
      );
      const records = result.data as Record<string, unknown>[];
      expect(records).toHaveLength(2);
      expect(records[0].tenant_id).toBe(TENANT_A);
      expect(records[1].tenant_id).toBe(TENANT_A);
    });
  });

  describe("scopeOperation", () => {
    const buildCtx = (operation: string, args = {}): OperationContext & { captured: unknown[] } => {
      const captured: unknown[] = [];
      return {
        operation,
        args,
        query: (a) => {
          captured.push(a);
          return Promise.resolve(null);
        },
        captured,
      };
    };

    const READ_OPS = [
      "findFirst", "findFirstOrThrow", "findMany",
      "findUnique", "findUniqueOrThrow",
      "count", "aggregate", "groupBy",
    ];
    const MUTATE_OPS = ["update", "updateMany", "delete", "deleteMany", "upsert"];

    it.each(READ_OPS)("deve injetar tenant_id no where em %s", async (op) => {
      const ctx = buildCtx(op, { where: { is_active: true } });
      await scopeOperation(ctx, TENANT_A);
      const passedArgs = ctx.captured[0] as Record<string, unknown>;
      expect((passedArgs.where as Record<string, unknown>).tenant_id).toBe(TENANT_A);
    });

    it.each(MUTATE_OPS)("deve injetar tenant_id no where em %s", async (op) => {
      const ctx = buildCtx(op, {});
      await scopeOperation(ctx, TENANT_A);
      const passedArgs = ctx.captured[0] as Record<string, unknown>;
      expect((passedArgs.where as Record<string, unknown>).tenant_id).toBe(TENANT_A);
    });

    it("deve injetar tenant_id em create (where + data)", async () => {
      const ctx = buildCtx("create", { data: { name: "test" } });
      await scopeOperation(ctx, TENANT_A);
      const passedArgs = ctx.captured[0] as Record<string, unknown>;
      expect((passedArgs.data as Record<string, unknown>).tenant_id).toBe(TENANT_A);
    });

    it("deve garantir que dois tenants distintos produzem args isolados", async () => {
      const ctxA = buildCtx("findMany", {});
      const ctxB = buildCtx("findMany", {});

      await scopeOperation(ctxA, TENANT_A);
      await scopeOperation(ctxB, TENANT_B);

      const argsA = ctxA.captured[0] as Record<string, unknown>;
      const argsB = ctxB.captured[0] as Record<string, unknown>;

      expect((argsA.where as Record<string, unknown>).tenant_id).toBe(TENANT_A);
      expect((argsB.where as Record<string, unknown>).tenant_id).toBe(TENANT_B);
      expect((argsA.where as Record<string, unknown>).tenant_id).not.toBe(
        (argsB.where as Record<string, unknown>).tenant_id
      );
    });

    it("não deve injetar tenant_id em operações não listadas", async () => {
      const ctx = buildCtx("executeRaw", {});
      await scopeOperation(ctx, TENANT_A);
      const passedArgs = ctx.captured[0] as Record<string, unknown>;
      // where should be undefined — raw ops are not tenant-scoped
      expect(passedArgs.where).toBeUndefined();
    });
  });
});
