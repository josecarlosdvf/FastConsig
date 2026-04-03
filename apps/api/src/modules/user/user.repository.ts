import { createTenantClient } from "../../shared/database/tenant-prisma";
import { getContext } from "@fastconsig/core";

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: "ADMIN" | "MEMBER";
  tenant_id: string;
}

const USER_PUBLIC_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  created_at: true,
  updated_at: true,
} as const;

export class UserRepository {
  // tenant_id is injected automatically by the scoped client — no manual filtering needed
  private db(tenantId: string) {
    return createTenantClient(tenantId);
  }

  async findAll(tenantId: string) {
    return this.db(tenantId).user.findMany({
      where: { is_active: true },
      select: USER_PUBLIC_FIELDS,
    });
  }

  async findById(id: string, tenantId: string) {
    return this.db(tenantId).user.findFirst({
      where: { id, is_active: true },
      select: USER_PUBLIC_FIELDS,
    });
  }

  async findByEmail(email: string, tenantId: string) {
    return this.db(tenantId).user.findFirst({
      where: { email, is_active: true },
    });
  }

  async create(data: CreateUserData) {
    const { tenant_id, ...rest } = data;
    const ctx = getContext();
    return this.db(tenant_id).user.create({
      data: {
        tenant_id,
        ...rest,
        updated_by: ctx?.userId ?? null,
      },
      select: USER_PUBLIC_FIELDS,
    });
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<Pick<CreateUserData, "name" | "email" | "role">>
  ) {
    const ctx = getContext();
    return this.db(tenantId).user.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
        updated_by: ctx?.userId ?? null,
      },
      select: USER_PUBLIC_FIELDS,
    });
  }

  async softDelete(id: string, tenantId: string) {
    const ctx = getContext();
    return this.db(tenantId).user.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date(),
        updated_by: ctx?.userId ?? null,
      },
    });
  }
}
