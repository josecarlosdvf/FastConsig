import { prisma } from "../../shared/database/prisma";

export interface CreateTenantData {
  name: string;
  slug: string;
}

export class TenantRepository {
  async findAll() {
    return prisma.tenant.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        slug: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.tenant.findFirst({
      where: { id, is_active: true },
      select: {
        id: true,
        name: true,
        slug: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.tenant.findFirst({
      where: { slug, is_active: true },
    });
  }

  async create(data: CreateTenantData) {
    return prisma.tenant.create({
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async update(id: string, data: Partial<CreateTenantData>) {
    return prisma.tenant.update({
      where: { id, is_active: true },
      data: { ...data, updated_at: new Date() },
      select: {
        id: true,
        name: true,
        slug: true,
        created_at: true,
        updated_at: true,
      },
    });
  }
}
