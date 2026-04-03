import { Request, Response } from "express";
import { UserService } from "./user.service";
import { AuthRequest } from "../../shared/middleware/auth.middleware";

export class UserController {
  constructor(private service: UserService) {}

  async findAll(req: Request, res: Response): Promise<void> {
    const { tenantId } = req as AuthRequest;
    const users = await this.service.findAll(tenantId);
    res.json(users);
  }

  async findById(req: Request, res: Response): Promise<void> {
    const { tenantId } = req as AuthRequest;
    const user = await this.service.findById(req.params.id, tenantId);
    res.json(user);
  }

  async create(req: Request, res: Response): Promise<void> {
    const { tenantId } = req as AuthRequest;
    // req.body is already validated by validate(createUserSchema) in the router
    const user = await this.service.create(req.body, tenantId);
    res.status(201).json(user);
  }

  async update(req: Request, res: Response): Promise<void> {
    const { tenantId } = req as AuthRequest;
    // req.body is already validated by validate(updateUserSchema) in the router
    const user = await this.service.update(req.params.id, tenantId, req.body);
    res.json(user);
  }

  async remove(req: Request, res: Response): Promise<void> {
    const { tenantId } = req as AuthRequest;
    await this.service.remove(req.params.id, tenantId);
    res.status(204).send();
  }
}
