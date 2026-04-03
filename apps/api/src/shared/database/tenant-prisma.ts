import { prisma } from "./prisma";

type WhereArgs = { where?: Record<string, unknown> };
type DataArgs = { data?: Record<string, unknown> | Record<string, unknown>[] };
type ExtendedArgs = WhereArgs & DataArgs & Record<string, unknown>;
type QueryFn = (args: ExtendedArgs) => Promise<unknown>;

export interface OperationContext {
  operation: string;
  args: ExtendedArgs;
  query: QueryFn;
}

export function injectTenantWhere(args: ExtendedArgs, tenantId: string): ExtendedArgs {
  return { ...args, where: { ...(args.where ?? {}), tenant_id: tenantId } };
}

export function injectTenantCreate(args: ExtendedArgs, tenantId: string): ExtendedArgs {
  const data = args.data;
  if (Array.isArray(data)) {
    return { ...args, data: data.map((r) => ({ ...(r as Record<string, unknown>), tenant_id: tenantId })) };
  }
  return { ...args, data: { ...(data ?? {}), tenant_id: tenantId } };
}

const WRITE_OPS = new Set(["create", "createMany"]);
const SCOPED_OPS = new Set([
  "findFirst", "findFirstOrThrow", "findMany",
  "findUnique", "findUniqueOrThrow",
  "count", "aggregate", "groupBy",
  "update", "updateMany", "delete", "deleteMany", "upsert",
]);

export function scopeOperation({ operation, args, query }: OperationContext, tenantId: string): Promise<unknown> {
  let scopedArgs = args;

  if (SCOPED_OPS.has(operation)) {
    scopedArgs = injectTenantWhere(scopedArgs, tenantId);
  }
  if (WRITE_OPS.has(operation)) {
    scopedArgs = injectTenantCreate(scopedArgs, tenantId);
  }

  return query(scopedArgs);
}

/**
 * Creates a Prisma client scoped to a specific tenant.
 *
 * Every query on tenant-scoped models (`user`, `refreshToken`) automatically
 * receives `tenant_id` in the where/data clause. This is a structural safety
 * net — even if a developer forgets to add the filter, data will never leak
 * across tenants.
 */
export function createTenantClient(tenantId: string) {
  return prisma.$extends({
    query: {
      user: {
        $allOperations(ctx: OperationContext) {
          return scopeOperation(ctx, tenantId);
        },
      },
      refreshToken: {
        $allOperations(ctx: OperationContext) {
          return scopeOperation(ctx, tenantId);
        },
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof createTenantClient>;
