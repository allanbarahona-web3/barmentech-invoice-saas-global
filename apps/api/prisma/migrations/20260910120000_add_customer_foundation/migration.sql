-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('PERSON', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "CustomerAddressType" AS ENUM ('BUSINESS', 'BILLING', 'SHIPPING', 'OTHER');

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "CustomerType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "firstName" TEXT,
    "middleName" TEXT,
    "lastName" TEXT,
    "secondLastName" TEXT,
    "legalName" TEXT,
    "tradeName" TEXT,
    "identificationType" TEXT,
    "identificationValue" TEXT,
    "normalizedIdentificationValue" TEXT,
    "countryCode" VARCHAR(2),
    "email" TEXT,
    "billingEmail" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "customers_type_required_name_fields" CHECK (
      (
        "type" = 'PERSON'
        AND "firstName" IS NOT NULL
        AND "lastName" IS NOT NULL
      )
      OR (
        "type" = 'ORGANIZATION'
        AND "legalName" IS NOT NULL
      )
    ),
    CONSTRAINT "customers_identification_fields_consistent" CHECK (
      (
        "identificationType" IS NULL
        AND "identificationValue" IS NULL
        AND "normalizedIdentificationValue" IS NULL
      )
      OR
      (
        "identificationType" IS NOT NULL
        AND "identificationValue" IS NOT NULL
        AND "normalizedIdentificationValue" IS NOT NULL
      )
    )
);

-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "CustomerAddressType" NOT NULL,
    "countryCode" VARCHAR(2),
    "region" TEXT,
    "city" TEXT,
    "district" TEXT,
    "postalCode" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_id_tenantId_key" ON "customers"("id", "tenantId");

-- CreateIndex
CREATE INDEX "customers_tenantId_idx" ON "customers"("tenantId");

-- CreateIndex
CREATE INDEX "customers_tenantId_isActive_idx" ON "customers"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "customers_tenantId_displayName_idx" ON "customers"("tenantId", "displayName");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenantId_identificationType_normalizedIdentificationValue_key"
ON "customers"("tenantId", "identificationType", "normalizedIdentificationValue")
WHERE "identificationType" IS NOT NULL
  AND "identificationValue" IS NOT NULL
  AND "normalizedIdentificationValue" IS NOT NULL;

-- CreateIndex
CREATE INDEX "customer_addresses_tenantId_idx" ON "customer_addresses"("tenantId");

-- CreateIndex
CREATE INDEX "customer_addresses_tenantId_customerId_idx" ON "customer_addresses"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "customer_addresses_tenantId_customerId_type_idx" ON "customer_addresses"("tenantId", "customerId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "customer_addresses_tenantId_customerId_type_primary_key"
ON "customer_addresses"("tenantId", "customerId", "type")
WHERE "isPrimary" = true;

-- AddForeignKey
ALTER TABLE "customers"
ADD CONSTRAINT "customers_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_addresses"
ADD CONSTRAINT "customer_addresses_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_addresses"
ADD CONSTRAINT "customer_addresses_customerId_tenantId_fkey"
FOREIGN KEY ("customerId", "tenantId") REFERENCES "customers"("id", "tenantId")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable tenant isolation for tenant-owned customers.
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_tenant_isolation"
ON "customers"
USING (
  "tenantId" = current_setting('app.current_tenant_id', true)
)
WITH CHECK (
  "tenantId" = current_setting('app.current_tenant_id', true)
);

-- Enable tenant isolation for tenant-owned customer addresses.
ALTER TABLE "customer_addresses" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_addresses_tenant_isolation"
ON "customer_addresses"
USING (
  "tenantId" = current_setting('app.current_tenant_id', true)
)
WITH CHECK (
  "tenantId" = current_setting('app.current_tenant_id', true)
);
