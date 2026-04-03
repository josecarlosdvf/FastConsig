import { prisma } from "../../shared/database/prisma";

export interface AuthCredentials {
  email: string;
  password: string;
  tenantId: string;
}

export class AuthRepository {
  async findUserByEmail(email: string, tenantId: string) {
    return prisma.user.findFirst({
      where: { email, tenant_id: tenantId, is_active: true },
    });
  }
}
