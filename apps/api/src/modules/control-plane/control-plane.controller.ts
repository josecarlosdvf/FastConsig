import { Request, Response } from "express";
import { AuthRequest } from "../../shared/middleware/auth.middleware";
import { ControlPlaneService } from "./control-plane.service";

export class ControlPlaneController {
  constructor(private readonly service: ControlPlaneService) {}

  listPages(req: Request, res: Response): void {
    const { userRole } = req as AuthRequest;
    res.json(this.service.listPagesForRole(userRole));
  }
}
