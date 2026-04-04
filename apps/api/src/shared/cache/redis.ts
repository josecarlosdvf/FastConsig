import { createClient } from "redis";
import { createLogger } from "@fastconsig/core";

const log = createLogger("redis-cache");

type RedisClient = ReturnType<typeof createClient>;
let redisClient: RedisClient | null = null;

function shouldUseRedis(): boolean {
  return Boolean(process.env.REDIS_URL);
}

export async function getRedisClient(): Promise<RedisClient | null> {
  if (!shouldUseRedis()) return null;
  if (redisClient) return redisClient;

  const client = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries: number): number => Math.min(500 * retries, 5000),
    },
  });

  client.on("error", (err: unknown) => {
    log.error({ err }, "Redis client error");
  });

  try {
    await client.connect();
    redisClient = client;
    log.info("Redis cache connected");
    return redisClient;
  } catch (err) {
    log.warn({ err }, "Failed to connect Redis cache, falling back to DB only");
    return null;
  }
}

export async function closeRedisClient(): Promise<void> {
  if (!redisClient) return;
  await redisClient.quit();
  redisClient = null;
}
