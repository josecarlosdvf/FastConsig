import { createTenantClient } from "../../shared/database/tenant-prisma";

export class SessionRepository {
  async findAllActive(userId: string, tenantId: string) {
    return createTenantClient(tenantId).refreshToken.findMany({
      where: {
        user_id: userId,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
      select: {
        id: true,
        device_info: true,
        ip_address: true,
        last_used_at: true,
        created_at: true,
        expires_at: true,
      },
      orderBy: { created_at: "desc" },
    });
  }

  async findActiveById(sessionId: string, tenantId: string) {
    return createTenantClient(tenantId).refreshToken.findFirst({
      where: {
        id: sessionId,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
    });
  }

  async revokeById(sessionId: string, tenantId: string) {
    return createTenantClient(tenantId).refreshToken.updateMany({
      where: { id: sessionId },
      data: { revoked_at: new Date() },
    });
  }

  async revokeAllForUser(userId: string, tenantId: string) {
    return createTenantClient(tenantId).refreshToken.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }
}
