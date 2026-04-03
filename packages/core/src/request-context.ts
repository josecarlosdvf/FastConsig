import { AsyncLocalStorage } from "async_hooks";

/**
 * Per-request context propagated automatically via AsyncLocalStorage.
 *
 * Set once in `contextMiddleware`, then enriched by `tenantMiddleware` and
 * `authMiddleware` as those fields become available. All async operations
 * initiated within the same request automatically inherit this context.
 *
 * Reading the context is safe from any module — no prop-drilling needed.
 *
 * @example
 * const ctx = getContext();
 * logger.info({ tenantId: ctx?.tenantId }, "processing");
 */
export interface RequestContext {
  requestId: string;
  tenantId?: string;
  userId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

/** Returns the current request context, or undefined if called outside a request. */
export function getContext(): RequestContext | undefined {
  return requestContext.getStore();
}

/**
 * Runs `fn` within a new request context.
 * Used exclusively by `contextMiddleware` to wrap the Express request pipeline.
 */
export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return requestContext.run(ctx, fn);
}
