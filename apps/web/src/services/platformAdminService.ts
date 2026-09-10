"use client";

import { getHttpClient } from "@/lib/httpClient";

type PlatformTenantResponse = {
    tenantId: string;
    tenantName: string;
    subdomain: string | null;
    customDomain: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    countryCode: string | null;
    defaultCurrencyCode: string | null;
    locale: string | null;
    timezone: string | null;
};

export interface PlatformTenant {
    id: string;
    name: string;
    subdomain: string | null;
    customDomain: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    countryCode: string | null;
    defaultCurrencyCode: string | null;
    locale: string | null;
    timezone: string | null;
}

export const platformAdminService = {
    async listTenants(): Promise<PlatformTenant[]> {
        const http = getHttpClient();
        const response = await http.get<PlatformTenantResponse[]>(
            "/v1/platform/tenants",
        );

        return response.data.map((tenant) => ({
            id: tenant.tenantId,
            name: tenant.tenantName,
            subdomain: tenant.subdomain,
            customDomain: tenant.customDomain,
            isActive: tenant.isActive,
            createdAt: tenant.createdAt,
            updatedAt: tenant.updatedAt,
            countryCode: tenant.countryCode,
            defaultCurrencyCode: tenant.defaultCurrencyCode,
            locale: tenant.locale,
            timezone: tenant.timezone,
        }));
    },
};
