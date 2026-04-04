import { PrismaClient, EventStatus } from "@prisma/client";
import { prisma } from "../../shared/database/prisma";

interface QueueEventInput {
  tenantId?: string;
  eventName: string;
  payload: Record<string, unknown>;
  maxAttempts?: number;
}

export class EventsRepository {
  private db(): PrismaClient {
    return prisma as PrismaClient;
  }

  async queue(input: QueueEventInput): Promise<void> {
    await this.db().eventOutbox.create({
      data: {
        tenant_id: input.tenantId ?? null,
        event_name: input.eventName,
        payload: input.payload,
        max_attempts: input.maxAttempts ?? 5,
      },
    });
  }

  async claimBatch(limit = 20) {
    const now = new Date();
    const rows = await this.db().eventOutbox.findMany({
      where: {
        OR: [
          { status: EventStatus.PENDING, next_retry_at: null },
          { status: EventStatus.PENDING, next_retry_at: { lte: now } },
          { status: EventStatus.FAILED, next_retry_at: { lte: now } },
        ],
      },
      orderBy: { created_at: "asc" },
      take: limit,
    });

    const claimed: typeof rows = [];
    for (const row of rows) {
      const updated = await this.db().eventOutbox.updateMany({
        where: {
          id: row.id,
          status: row.status,
        },
        data: { status: EventStatus.PROCESSING },
      });
      if (updated.count > 0) claimed.push(row);
    }
    return claimed;
  }

  async markDelivered(id: string): Promise<void> {
    await this.db().eventOutbox.update({
      where: { id },
      data: { status: EventStatus.DELIVERED, last_error: null, next_retry_at: null },
    });
  }

  async markFailed(id: string, attempts: number, maxAttempts: number, reason: string): Promise<void> {
    const nextRetryAt = new Date(Date.now() + Math.min(30000, Math.pow(2, attempts) * 1000));
    await this.db().eventOutbox.update({
      where: { id },
      data: {
        attempts,
        last_error: reason,
        status: attempts >= maxAttempts ? EventStatus.DEAD_LETTER : EventStatus.FAILED,
        next_retry_at: attempts >= maxAttempts ? null : nextRetryAt,
      },
    });
  }

  async listDeadLetter(tenantId: string) {
    return this.db().eventOutbox.findMany({
      where: { tenant_id: tenantId, status: EventStatus.DEAD_LETTER },
      orderBy: { created_at: "desc" },
      take: 200,
    });
  }

  async replayDeadLetter(id: string): Promise<void> {
    await this.db().eventOutbox.update({
      where: { id },
      data: {
        status: EventStatus.PENDING,
        attempts: 0,
        last_error: null,
        next_retry_at: null,
      },
    });
  }
}
