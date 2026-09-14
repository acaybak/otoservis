-- CreateTable
CREATE TABLE "licenses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "license_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "plan_type" TEXT NOT NULL DEFAULT 'STANDARD',
    "max_users" INTEGER NOT NULL DEFAULT 3,
    "activated_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "machine_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "plan_type" TEXT NOT NULL DEFAULT 'STANDARD',
    "max_users" INTEGER NOT NULL DEFAULT 3,
    "duration" INTEGER NOT NULL DEFAULT 365,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "tenant_id" TEXT,
    "license_id" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activated_at" TIMESTAMP(3),

    CONSTRAINT "license_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "licenses_tenant_id_key" ON "licenses"("tenant_id");
CREATE UNIQUE INDEX "licenses_license_key_key" ON "licenses"("license_key");
CREATE UNIQUE INDEX "license_keys_key_key" ON "license_keys"("key");
CREATE UNIQUE INDEX "license_keys_license_id_key" ON "license_keys"("license_id");

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
