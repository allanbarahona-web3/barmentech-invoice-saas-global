export type PlatformTenantListItemDto = {
  tenantId: string;
  tenantName: string;
  subdomain: string | null;
  customDomain: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  countryCode: string | null;
  defaultCurrencyCode: string | null;
  locale: string | null;
  timezone: string | null;
};
