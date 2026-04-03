import { prisma } from "./prisma";

/**
 * Creates a Prisma client scoped to a specific tenant.
 *
 * Every query on tenant-scoped models (e.g. `user`) automatically receives
 * `tenant_id` in the where/data clause. This is a structural safety net —
 * developers cannot accidentally leak data across tenants even if they forget
 * to add the filter manually.
 *
 * Usage in repositories:
 *   const db = createTenantClient(tenantId);
 *   return db.user.findMany(); // tenant_id is injected automatically
 */
export function createTenantClient(tenantId: string) {
  return prisma.$extends({
    query: {
      user: {
        async $allOperations({
          operation,
          args,
          query,
        }: {
          operation: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          args: Record<string, any>;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          query: (args: Record<string, any>) => Promise<unknown>;
        }) {
          const writeOps = ["create", "createMany"];
          const mutateOps = [
            "findFirst",
            "findFirstOrThrow",
            "findMany",
            "findUnique",
            "findUniqueOrThrow",
            "count",
            "aggregate",
            "groupBy",
            "update",
            "updateMany",
            "delete",
            "deleteMany",
            "upsert",
          ];

          if (mutateOps.includes(operation)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            args = {
              ...args,
              where: { ...(args.where as object | undefined), tenant_id: tenantId },
            };
          }

          if (writeOps.includes(operation)) {
            if (operation === "create") {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              args = {
                ...args,
                data: { ...(args.data as object | undefined), tenant_id: tenantId },
              };
            }
            if (operation === "createMany") {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              const records = Array.isArray(args.data) ? args.data : [args.data];
              args = {
                ...args,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                data: records.map((r: object) => ({ ...r, tenant_id: tenantId })),
              };
            }
          }

          return query(args);
        },
      },
      refreshToken: {
        async $allOperations({
          operation,
          args,
          query,
        }: {
          operation: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          args: Record<string, any>;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          query: (args: Record<string, any>) => Promise<unknown>;
        }) {
          const mutateOps = [
            "findFirst",
            "findFirstOrThrow",
            "findMany",
            "findUnique",
            "findUniqueOrThrow",
            "count",
            "update",
            "updateMany",
            "delete",
            "deleteMany",
          ];

          if (mutateOps.includes(operation)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            args = {
              ...args,
              where: { ...(args.where as object | undefined), tenant_id: tenantId },
            };
          }

          if (operation === "create") {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            args = {
              ...args,
              data: { ...(args.data as object | undefined), tenant_id: tenantId },
            };
          }

          return query(args);
        },
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof createTenantClient>;
