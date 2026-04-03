import { Request, Response } from "express";
import { TenantService } from "./tenant.service";

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
    // req.body is already validated by validate(createTenantSchema) in the router
    const tenant = await this.service.create(req.body);
    res.status(201).json(tenant);
  }

  async update(req: Request, res: Response): Promise<void> {
    // req.body is already validated by validate(updateTenantSchema) in the router
    const tenant = await this.service.update(req.params.id, req.body);
    res.json(tenant);
  }
}
