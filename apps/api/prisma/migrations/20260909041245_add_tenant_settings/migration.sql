/*
  Warnings:

  - You are about to drop the column `businessAddress` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the column `contactEmail` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the column `contactPhone` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the column `contactWhatsApp` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the column `emailLogoUrl` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the column `legalId` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the column `legalName` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the column `preferredCurrency` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the column `primaryColor` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the column `secondaryColor` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the column `websiteUrl` on the `Tenant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "businessAddress",
DROP COLUMN "contactEmail",
DROP COLUMN "contactPhone",
DROP COLUMN "contactWhatsApp",
DROP COLUMN "emailLogoUrl",
DROP COLUMN "legalId",
DROP COLUMN "legalName",
DROP COLUMN "logoUrl",
DROP COLUMN "preferredCurrency",
DROP COLUMN "primaryColor",
DROP COLUMN "secondaryColor",
DROP COLUMN "websiteUrl";

-- CreateTable
CREATE TABLE "tenant_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "legalName" TEXT,
    "legalId" TEXT,
    "businessAddress" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactWhatsApp" TEXT,
    "websiteUrl" TEXT,
    "logoUrl" TEXT,
    "emailLogoUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "countryCode" VARCHAR(2),
    "defaultCurrencyCode" VARCHAR(3),
    "timezone" VARCHAR(100),
    "locale" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_settings_tenantId_key" ON "tenant_settings"("tenantId");

-- AddForeignKey
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable tenant isolation for tenant settings.
ALTER TABLE "tenant_settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_settings_tenant_isolation"
ON "tenant_settings"
USING (
  "tenantId" = current_setting('app.current_tenant_id', true)
)
WITH CHECK (
  "tenantId" = current_setting('app.current_tenant_id', true)
);
