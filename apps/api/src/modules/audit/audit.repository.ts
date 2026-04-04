import type { Prisma, PrismaClient } from "@prisma/client";
import { getContext } from "@fastconsig/core";
import { prisma } from "../../shared/database/prisma";

interface AuditCreateInput {
  tenantId: string;
  eventName: string;
  payload: Record<string, unknown>;
  actorUserId?: string;
}

interface AuditListFilter {
  tenantId: string;
  eventName?: string;
  from?: string;
  to?: string;
  limit: number;
}

export class AuditRepository {
  private db(): PrismaClient {
    return prisma;
  }

  async create(input: AuditCreateInput): Promise<void> {
    const ctx = getContext();
    await this.db().auditTrail.create({
      data: {
        tenant_id: input.tenantId,
        event_name: input.eventName,
        actor_user_id: input.actorUserId ?? ctx?.userId ?? null,
        request_id: ctx?.requestId ?? null,
        trace_id: ctx?.traceId ?? null,
        payload: input.payload as Prisma.InputJsonObject,
      },
    });
  }

  async list(filter: AuditListFilter) {
    return this.db().auditTrail.findMany({
      where: {
        tenant_id: filter.tenantId,
        ...(filter.eventName ? { event_name: filter.eventName } : {}),
        ...(filter.from || filter.to
          ? {
            created_at: {
              ...(filter.from ? { gte: new Date(filter.from) } : {}),
              ...(filter.to ? { lte: new Date(filter.to) } : {}),
            },
          }
          : {}),
      },
      orderBy: { created_at: "desc" },
      take: filter.limit,
    });
  }
}
