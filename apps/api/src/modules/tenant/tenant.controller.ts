import { Request, Response } from "express";
import { TenantService } from "./tenant.service";
import { createTenantSchema, updateTenantSchema } from "./tenant.schema";

export class TenantController {
  constructor(private service: TenantService) {}

  async findAll(_req: Request, res: Response): Promise<void> {
    const tenants = await this.service.findAll();
    res.json(tenants);
  }

  async findById(req: Request, res: Response): Promise<void> {
    const tenant = await this.service.findById(req.params.id);
    res.json(tenant);
  }

  async create(req: Request, res: Response): Promise<void> {
    const data = createTenantSchema.parse(req.body);
    const tenant = await this.service.create(data);
    res.status(201).json(tenant);
  }

  async update(req: Request, res: Response): Promise<void> {
    const data = updateTenantSchema.parse(req.body);
    const tenant = await this.service.update(req.params.id, data);
    res.json(tenant);
  }
}
