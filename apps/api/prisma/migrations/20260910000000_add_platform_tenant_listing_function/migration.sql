-- Platform-only cross-tenant projection. Direct access to tenant-owned tables
-- remains subject to their existing RLS policies.
CREATE FUNCTION public.platform_list_tenants_v1()
RETURNS TABLE (
  "tenantId" TEXT,
  "tenantName" TEXT,
  "subdomain" TEXT,
  "customDomain" TEXT,
  "isActive" BOOLEAN,
  "createdAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3),
  "countryCode" VARCHAR(2),
  "defaultCurrencyCode" VARCHAR(3),
  "locale" VARCHAR(20),
  "timezone" VARCHAR(100)
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    tenant."id" AS "tenantId",
    tenant."name" AS "tenantName",
    tenant."subdomain",
    tenant."customDomain",
    tenant."isActive",
    tenant."createdAt",
    tenant."updatedAt",
    settings."countryCode",
    settings."defaultCurrencyCode",
    settings."locale",
    settings."timezone"
  FROM public."Tenant" AS tenant
  LEFT JOIN public."tenant_settings" AS settings
    ON settings."tenantId" = tenant."id"
  ORDER BY tenant."createdAt" ASC, tenant."id" ASC;
$$;

REVOKE ALL ON FUNCTION public.platform_list_tenants_v1() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.platform_list_tenants_v1() TO invoice_app;
