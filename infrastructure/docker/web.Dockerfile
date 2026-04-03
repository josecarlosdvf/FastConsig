FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json turbo.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/ ./packages/

RUN npm ci

COPY apps/web ./apps/web

RUN npm run build --workspace=apps/web

# ---- production image ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
