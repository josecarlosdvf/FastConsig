import { PrismaClient } from "@prisma/client";
import { prisma } from "../../shared/database/prisma";

export class OpsRepository {
  private db(): PrismaClient {
    return prisma;
  }

  async durablePipelineHealth(): Promise<{
    pending: number;
    processing: number;
    failed: number;
    deadLetter: number;
    deliveredLastHour: number;
  }> {
    const [pending, processing, failed, deadLetter, deliveredLastHour] = await Promise.all([
      this.db().eventOutbox.count({ where: { status: "PENDING" } }),
      this.db().eventOutbox.count({ where: { status: "PROCESSING" } }),
      this.db().eventOutbox.count({ where: { status: "FAILED" } }),
      this.db().eventOutbox.count({ where: { status: "DEAD_LETTER" } }),
      this.db().eventOutbox.count({
        where: {
          status: "DELIVERED",
          updated_at: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      }),
    ]);

    return { pending, processing, failed, deadLetter, deliveredLastHour };
  }
}
