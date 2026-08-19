-- Fase 4 — Fundação Técnica
-- Cria o model técnico SystemSetting: valida Prisma Client real,
-- migration real, seed real e conexão real (via driver adapter).
-- Não é uma entidade de negócio — apenas infraestrutura técnica.

CREATE TABLE "system_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");
