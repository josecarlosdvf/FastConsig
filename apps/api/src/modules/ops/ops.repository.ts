import { PrismaClient, EventStatus } from "@prisma/client";
import { prisma } from "../../shared/database/prisma";

export class OpsRepository {
  private db(): PrismaClient {
    return prisma as PrismaClient;
  }

  async durablePipelineHealth(): Promise<{
    pending: number;
    processing: number;
    failed: number;
    deadLetter: number;
    deliveredLastHour: number;
  }> {
    const [pending, processing, failed, deadLetter, deliveredLastHour] = await Promise.all([
      this.db().eventOutbox.count({ where: { status: EventStatus.PENDING } }),
      this.db().eventOutbox.count({ where: { status: EventStatus.PROCESSING } }),
      this.db().eventOutbox.count({ where: { status: EventStatus.FAILED } }),
      this.db().eventOutbox.count({ where: { status: EventStatus.DEAD_LETTER } }),
      this.db().eventOutbox.count({
        where: {
          status: EventStatus.DELIVERED,
          updated_at: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      }),
    ]);

    return { pending, processing, failed, deadLetter, deliveredLastHour };
  }
}
