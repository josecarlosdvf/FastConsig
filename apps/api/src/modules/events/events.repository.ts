import type { PrismaClient } from "@prisma/client";
import type { InputJsonObject } from "@prisma/client/runtime/library";
import { prisma } from "../../shared/database/prisma";

interface QueueEventInput {
  tenantId?: string;
  eventName: string;
  payload: Record<string, unknown>;
  maxAttempts?: number;
}

export class EventsRepository {
  private db(): PrismaClient {
    return prisma;
  }

  async queue(input: QueueEventInput): Promise<void> {
    await this.db().eventOutbox.create({
      data: {
        tenant_id: input.tenantId ?? null,
        event_name: input.eventName,
        payload: input.payload as InputJsonObject,
        max_attempts: input.maxAttempts ?? 5,
      },
    });
  }

  async claimBatch(limit = 20) {
    const now = new Date();
    const rows = await this.db().eventOutbox.findMany({
      where: {
        OR: [
          { status: "PENDING", next_retry_at: null },
          { status: "PENDING", next_retry_at: { lte: now } },
          { status: "FAILED", next_retry_at: { lte: now } },
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
        data: { status: "PROCESSING" },
      });
      if (updated.count > 0) claimed.push(row);
    }
    return claimed;
  }

  async markDelivered(id: string): Promise<void> {
    await this.db().eventOutbox.update({
      where: { id },
      data: { status: "DELIVERED", last_error: null, next_retry_at: null },
    });
  }

  async markFailed(id: string, attempts: number, maxAttempts: number, reason: string): Promise<void> {
    const nextRetryAt = new Date(Date.now() + Math.min(30000, Math.pow(2, attempts) * 1000));
    await this.db().eventOutbox.update({
      where: { id },
      data: {
        attempts,
        last_error: reason,
        status: attempts >= maxAttempts ? "DEAD_LETTER" : "FAILED",
        next_retry_at: attempts >= maxAttempts ? null : nextRetryAt,
      },
    });
  }

  async listDeadLetter(tenantId: string) {
    return this.db().eventOutbox.findMany({
      where: { tenant_id: tenantId, status: "DEAD_LETTER" },
      orderBy: { created_at: "desc" },
      take: 200,
    });
  }

  async replayDeadLetter(id: string): Promise<void> {
    await this.db().eventOutbox.update({
      where: { id },
      data: {
        status: "PENDING",
        attempts: 0,
        last_error: null,
        next_retry_at: null,
      },
    });
  }
}
