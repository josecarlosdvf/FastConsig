import { TenantRepository, CreateTenantData } from "./tenant.repository";

export class TenantService {
  constructor(private repo: TenantRepository) {}

  async findAll() {
    return this.repo.findAll();
  }

  async findById(id: string) {
    const tenant = await this.repo.findById(id);
    if (!tenant) {
      const err = new Error("Tenant não encontrado") as Error & {
        statusCode: number;
      };
      err.statusCode = 404;
      throw err;
    }
    return tenant;
  }

  async create(data: CreateTenantData) {
    const existing = await this.repo.findBySlug(data.slug);
    if (existing) {
      const err = new Error("Slug já utilizado") as Error & {
        statusCode: number;
      };
      err.statusCode = 409;
      throw err;
    }
    return this.repo.create(data);
  }

  async update(id: string, data: Partial<CreateTenantData>) {
    await this.findById(id);
    return this.repo.update(id, data);
  }
}
