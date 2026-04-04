import { Request, Response } from "express";
import { OpsService } from "./ops.service";

export class OpsController {
  constructor(private readonly service: OpsService) {}

  async observability(_req: Request, res: Response): Promise<void> {
    res.json(await this.service.observabilitySnapshot());
  }
}
