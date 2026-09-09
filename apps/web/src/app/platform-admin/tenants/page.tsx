"use client";

import { TenantManagementTable } from "@/components/platform-admin/TenantManagementTable";
import { t } from "@/i18n";

export default function TenantManagementPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold">{t().platformAdmin.tenants}</h2>
                <p className="text-muted-foreground">
                    {t().platformAdmin.tenantsDescription}
                </p>
            </div>

            <TenantManagementTable />
        </div>
    );
}
