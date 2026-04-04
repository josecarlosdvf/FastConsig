import { Request, Response } from "express";
import { AuthRequest } from "../../shared/middleware/auth.middleware";
import { EventsService } from "./events.service";
import type { ReplayDeadLetterInput } from "./events.schema";

export class EventsController {
  constructor(private readonly service: EventsService) {}

  async listDeadLetter(req: Request, res: Response): Promise<void> {
    const { tenantId } = req as AuthRequest;
    res.json(await this.service.listDeadLetter(tenantId));
  }

  async replayDeadLetter(req: Request, res: Response): Promise<void> {
    const body = req.body as ReplayDeadLetterInput;
    await this.service.replayDeadLetter(body.id);
    res.status(204).send();
  }
}
