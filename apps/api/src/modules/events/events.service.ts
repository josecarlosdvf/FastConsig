import { createLogger, eventBus } from "@fastconsig/core";
import { getRedisClient } from "../../shared/cache/redis";
import { EventsRepository } from "./events.repository";

const log = createLogger("events-service");

interface QueuedEventPayload {
  id: string;
  eventName: string;
  tenantId?: string | null;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
}

export class EventsService {
  private workerRunning = false;
  private workerIntervalMs = 1500;

  constructor(private readonly repo: EventsRepository) {}

  async queueEvent(
    eventName: string,
    payload: Record<string, unknown>,
    tenantId?: string
  ): Promise<void> {
    await this.repo.queue({ tenantId, eventName, payload });
  }

  private async publishRedisChannel(event: QueuedEventPayload): Promise<void> {
    const redis = await getRedisClient();
    if (!redis) return;
    await redis.publish("fastconsig.events", JSON.stringify(event));
  }

  async processOnce(limit = 20): Promise<number> {
    const batch = await this.repo.claimBatch(limit);
    for (const item of batch) {
      const payload = item.payload as unknown as Record<string, unknown>;
      const eventData: QueuedEventPayload = {
        id: item.id,
        eventName: item.event_name,
        tenantId: item.tenant_id,
        payload,
        attempts: item.attempts,
        max_attempts: item.max_attempts,
      };

      try {
        eventBus.emit(item.event_name as never, payload as never);
        await this.publishRedisChannel(eventData);
        await this.repo.markDelivered(item.id);
      } catch (err) {
        const attempts = item.attempts + 1;
        const reason = err instanceof Error ? err.message : "unknown_error";
        await this.repo.markFailed(item.id, attempts, item.max_attempts, reason);

        if (attempts >= item.max_attempts) {
          eventBus.emit("event.dead_lettered", {
            eventName: item.event_name,
            reason,
            attempts,
            tenantId: item.tenant_id ?? undefined,
          });
        } else {
          eventBus.emit("event.retry", {
            eventName: item.event_name,
            reason,
            attempts,
            tenantId: item.tenant_id ?? undefined,
          });
        }
      }
    }
    return batch.length;
  }

  startWorker(): void {
    if (this.workerRunning) return;
    this.workerRunning = true;
    const loop = async (): Promise<void> => {
      if (!this.workerRunning) return;
      try {
        await this.processOnce(30);
      } catch (err) {
        log.error({ err }, "Event worker loop error");
      } finally {
        setTimeout(() => {
          void loop();
        }, this.workerIntervalMs);
      }
    };
    void loop();
  }

  stopWorker(): void {
    this.workerRunning = false;
  }

  async listDeadLetter(tenantId: string) {
    return this.repo.listDeadLetter(tenantId);
  }

  async replayDeadLetter(id: string): Promise<void> {
    await this.repo.replayDeadLetter(id);
  }
}
