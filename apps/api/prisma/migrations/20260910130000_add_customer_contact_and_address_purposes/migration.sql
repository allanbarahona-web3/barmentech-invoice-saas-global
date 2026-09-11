-- CUSTOMER-DB-02: additive Customer contact and multi-purpose address foundation.

-- Customer identities are mandatory going forward. Do not invent values for
-- existing rows: stop the migration until those records are corrected.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "customers"
    WHERE "identificationType" IS NULL
       OR "identificationValue" IS NULL
       OR "normalizedIdentificationValue" IS NULL
  ) THEN
    RAISE EXCEPTION
      'CUSTOMERS-DB-02 cannot require Customer identification while rows with missing identification data exist. Correct those rows before applying this migration.';
  END IF;
END $$;

ALTER TABLE "customers"
  ALTER COLUMN "identificationType" SET NOT NULL,
  ALTER COLUMN "identificationValue" SET NOT NULL,
  ALTER COLUMN "normalizedIdentificationValue" SET NOT NULL;

-- CreateEnum
CREATE TYPE "CustomerAddressPurpose" AS ENUM ('BUSINESS', 'BILLING', 'SHIPPING', 'OTHER');

-- CreateTable
CREATE TABLE "customer_emails" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "label" TEXT,
    "email" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isBilling" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_phones" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "label" TEXT,
    "phone" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_phones_pkey" PRIMARY KEY ("id")
);

-- The composite primary key prevents a duplicate purpose on one physical
-- address while allowing that address to have several distinct purposes.
CREATE TABLE "customer_address_purpose_assignments" (
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerAddressId" TEXT NOT NULL,
    "purpose" "CustomerAddressPurpose" NOT NULL,
    "isPrimaryForPurpose" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_address_purpose_assignments_pkey" PRIMARY KEY ("customerAddressId", "purpose")
);

-- The existing address type remains a compatibility field. This unique key
-- lets the purpose assignment FK prove that the assignment's customer and
-- tenant are the address owner's customer and tenant.
CREATE UNIQUE INDEX "customer_addresses_id_customerId_tenantId_key"
ON "customer_addresses"("id", "customerId", "tenantId");

-- CreateIndex
CREATE INDEX "customer_emails_tenantId_idx" ON "customer_emails"("tenantId");
CREATE INDEX "customer_emails_tenantId_customerId_idx" ON "customer_emails"("tenantId", "customerId");
CREATE UNIQUE INDEX "customer_emails_tenantId_customerId_primary_key"
ON "customer_emails"("tenantId", "customerId")
WHERE "isPrimary" = true;

CREATE INDEX "customer_phones_tenantId_idx" ON "customer_phones"("tenantId");
CREATE INDEX "customer_phones_tenantId_customerId_idx" ON "customer_phones"("tenantId", "customerId");
CREATE UNIQUE INDEX "customer_phones_tenantId_customerId_primary_key"
ON "customer_phones"("tenantId", "customerId")
WHERE "isPrimary" = true;

CREATE INDEX "customer_address_purpose_assignments_tenantId_idx"
ON "customer_address_purpose_assignments"("tenantId");
CREATE INDEX "cap_addr_tenant_customer_idx"
ON "customer_address_purpose_assignments"("tenantId", "customerId");
CREATE INDEX "cap_addr_tenant_address_idx"
ON "customer_address_purpose_assignments"("tenantId", "customerAddressId");
CREATE INDEX "cap_addr_customer_purpose_idx"
ON "customer_address_purpose_assignments"("tenantId", "customerId", "purpose");
CREATE UNIQUE INDEX "cap_addr_primary_purpose_uq"
ON "customer_address_purpose_assignments"("tenantId", "customerId", "purpose")
WHERE "isPrimaryForPurpose" = true;

-- AddForeignKey
ALTER TABLE "customer_emails"
ADD CONSTRAINT "customer_emails_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_emails"
ADD CONSTRAINT "customer_emails_customerId_tenantId_fkey"
FOREIGN KEY ("customerId", "tenantId") REFERENCES "customers"("id", "tenantId")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_phones"
ADD CONSTRAINT "customer_phones_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_phones"
ADD CONSTRAINT "customer_phones_customerId_tenantId_fkey"
FOREIGN KEY ("customerId", "tenantId") REFERENCES "customers"("id", "tenantId")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_address_purpose_assignments"
ADD CONSTRAINT "customer_address_purpose_assignments_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_address_purpose_assignments"
ADD CONSTRAINT "cap_addr_customer_fkey"
FOREIGN KEY ("customerId", "tenantId") REFERENCES "customers"("id", "tenantId")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_address_purpose_assignments"
ADD CONSTRAINT "cap_addr_address_owner_fkey"
FOREIGN KEY ("customerAddressId", "customerId", "tenantId")
REFERENCES "customer_addresses"("id", "customerId", "tenantId")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve the meaning of existing typed addresses without duplicating rows.
INSERT INTO "customer_address_purpose_assignments" (
  "tenantId",
  "customerId",
  "customerAddressId",
  "purpose",
  "isPrimaryForPurpose"
)
SELECT
  "tenantId",
  "customerId",
  "id",
  "type"::text::"CustomerAddressPurpose",
  "isPrimary"
FROM "customer_addresses";

-- Enable tenant isolation for new tenant-owned Customer data.
ALTER TABLE "customer_emails" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_emails_tenant_isolation"
ON "customer_emails"
USING (
  "tenantId" = current_setting('app.current_tenant_id', true)
)
WITH CHECK (
  "tenantId" = current_setting('app.current_tenant_id', true)
);

ALTER TABLE "customer_phones" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_phones_tenant_isolation"
ON "customer_phones"
USING (
  "tenantId" = current_setting('app.current_tenant_id', true)
)
WITH CHECK (
  "tenantId" = current_setting('app.current_tenant_id', true)
);

ALTER TABLE "customer_address_purpose_assignments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_address_purpose_assignments_tenant_isolation"
ON "customer_address_purpose_assignments"
USING (
  "tenantId" = current_setting('app.current_tenant_id', true)
)
WITH CHECK (
  "tenantId" = current_setting('app.current_tenant_id', true)
);
