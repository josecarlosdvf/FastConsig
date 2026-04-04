-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED', 'DEAD_LETTER');

-- CreateTable
CREATE TABLE "config_value_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "scope" "ConfigScope" NOT NULL,
    "version" INTEGER NOT NULL,
    "value" JSONB NOT NULL,
    "changed_by" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rolled_back" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "config_value_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_trails" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "trace_id" TEXT,
    "request_id" TEXT,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_trails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_outbox" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "event_name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "last_error" TEXT,
    "next_retry_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "config_value_versions_tenant_id_key_scope_version_key" ON "config_value_versions"("tenant_id", "key", "scope", "version");

-- CreateIndex
CREATE INDEX "config_value_versions_tenant_id_key_scope_changed_at_idx" ON "config_value_versions"("tenant_id", "key", "scope", "changed_at");

-- CreateIndex
CREATE INDEX "audit_trails_tenant_id_event_name_created_at_idx" ON "audit_trails"("tenant_id", "event_name", "created_at");

-- CreateIndex
CREATE INDEX "audit_trails_tenant_id_created_at_idx" ON "audit_trails"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "event_outbox_status_next_retry_at_idx" ON "event_outbox"("status", "next_retry_at");

-- CreateIndex
CREATE INDEX "event_outbox_tenant_id_event_name_created_at_idx" ON "event_outbox"("tenant_id", "event_name", "created_at");

-- AddForeignKey
ALTER TABLE "config_value_versions" ADD CONSTRAINT "config_value_versions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_trails" ADD CONSTRAINT "audit_trails_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
