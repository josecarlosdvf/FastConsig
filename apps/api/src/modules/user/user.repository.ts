import { prisma } from "../../shared/database/prisma";

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: "ADMIN" | "MEMBER";
  tenant_id: string;
}

export class UserRepository {
  async findAll(tenantId: string) {
    return prisma.user.findMany({
      where: { tenant_id: tenantId, is_active: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findById(id: string, tenantId: string) {
    return prisma.user.findFirst({
      where: { id, tenant_id: tenantId, is_active: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findByEmail(email: string, tenantId: string) {
    return prisma.user.findFirst({
      where: { email, tenant_id: tenantId, is_active: true },
    });
  }

  async create(data: CreateUserData) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<Pick<CreateUserData, "name" | "email" | "role">>
  ) {
    return prisma.user.update({
      where: { id, tenant_id: tenantId },
      data: { ...data, updated_at: new Date() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async softDelete(id: string, tenantId: string) {
    return prisma.user.update({
      where: { id, tenant_id: tenantId },
      data: { is_active: false, updated_at: new Date() },
    });
  }
}
