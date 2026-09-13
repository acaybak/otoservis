-- CreateTable
CREATE TABLE "maintenance_types" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "interval_km" INTEGER,
    "interval_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_maintenances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "maintenance_type_id" TEXT NOT NULL,
    "interval_km" INTEGER,
    "interval_days" INTEGER,
    "last_km" INTEGER,
    "last_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_maintenances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "maintenance_type_id" TEXT,
    "service_order_id" TEXT,
    "performed_at" TIMESTAMP(3) NOT NULL,
    "km" INTEGER,
    "notes" TEXT,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "maintenance_record_id" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "product_id" TEXT,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "maintenance_types_tenant_id_idx" ON "maintenance_types"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_types_tenant_id_name_key" ON "maintenance_types"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "vehicle_maintenances_tenant_id_idx" ON "vehicle_maintenances"("tenant_id");

-- CreateIndex
CREATE INDEX "vehicle_maintenances_vehicle_id_idx" ON "vehicle_maintenances"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_maintenances_vehicle_id_maintenance_type_id_key" ON "vehicle_maintenances"("vehicle_id", "maintenance_type_id");

-- CreateIndex
CREATE INDEX "maintenance_records_tenant_id_idx" ON "maintenance_records"("tenant_id");

-- CreateIndex
CREATE INDEX "maintenance_records_vehicle_id_idx" ON "maintenance_records"("vehicle_id");

-- CreateIndex
CREATE INDEX "maintenance_records_tenant_id_performed_at_idx" ON "maintenance_records"("tenant_id", "performed_at");

-- CreateIndex
CREATE INDEX "maintenance_items_maintenance_record_id_idx" ON "maintenance_items"("maintenance_record_id");

-- CreateIndex
CREATE INDEX "maintenance_items_product_id_idx" ON "maintenance_items"("product_id");

-- AddForeignKey
ALTER TABLE "maintenance_types" ADD CONSTRAINT "maintenance_types_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_maintenances" ADD CONSTRAINT "vehicle_maintenances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_maintenances" ADD CONSTRAINT "vehicle_maintenances_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_maintenances" ADD CONSTRAINT "vehicle_maintenances_maintenance_type_id_fkey" FOREIGN KEY ("maintenance_type_id") REFERENCES "maintenance_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_maintenance_type_id_fkey" FOREIGN KEY ("maintenance_type_id") REFERENCES "maintenance_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_items" ADD CONSTRAINT "maintenance_items_maintenance_record_id_fkey" FOREIGN KEY ("maintenance_record_id") REFERENCES "maintenance_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_items" ADD CONSTRAINT "maintenance_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
