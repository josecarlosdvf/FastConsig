import { AuditRepository } from "./audit.repository";
import type { ListAuditQuery } from "./audit.schema";

export class AuditService {
  constructor(private readonly repo: AuditRepository) {}

  async createEvent(
    tenantId: string,
    eventName: string,
    payload: Record<string, unknown>,
    actorUserId?: string
  ): Promise<void> {
    await this.repo.create({ tenantId, eventName, payload, actorUserId });
  }

  async list(tenantId: string, query: ListAuditQuery) {
    return this.repo.list({
      tenantId,
      eventName: query.eventName,
      from: query.from,
      to: query.to,
      limit: query.limit,
    });
  }
}
