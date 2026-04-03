import { createTenantClient } from "../../shared/database/tenant-prisma";

export interface AuthCredentials {
  email: string;
  password: string;
  tenantId: string;
}

export interface StoreRefreshTokenData {
  userId: string;
  tenantId: string;
  tokenHash: string;
  expiresAt: Date;
  deviceInfo?: string;
  ipAddress?: string;
}

export class AuthRepository {
  async findUserByEmail(email: string, tenantId: string) {
    return createTenantClient(tenantId).user.findFirst({
      where: { email, is_active: true },
    });
  }

  async findUserById(userId: string, tenantId: string) {
    return createTenantClient(tenantId).user.findFirst({
      where: { id: userId, is_active: true },
    });
  }

  async storeRefreshToken(data: StoreRefreshTokenData) {
    return createTenantClient(data.tenantId).refreshToken.create({
      data: {
        tenant_id: data.tenantId,
        user_id: data.userId,
        token_hash: data.tokenHash,
        expires_at: data.expiresAt,
        device_info: data.deviceInfo,
        ip_address: data.ipAddress,
      },
    });
  }

  async findRefreshToken(tokenHash: string, tenantId: string) {
    return createTenantClient(tenantId).refreshToken.findFirst({
      where: {
        token_hash: tokenHash,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
    });
  }

  async revokeRefreshToken(tokenHash: string, tenantId: string) {
    return createTenantClient(tenantId).refreshToken.updateMany({
      where: { token_hash: tokenHash },
      data: { revoked_at: new Date() },
    });
  }

  async revokeAllUserRefreshTokens(userId: string, tenantId: string) {
    return createTenantClient(tenantId).refreshToken.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }
}
