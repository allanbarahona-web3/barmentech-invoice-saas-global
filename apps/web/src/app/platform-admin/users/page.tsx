"use client";

import { t } from "@/i18n";

export default function UsersPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold">{t().platformAdmin.users}</h2>
                <p className="text-muted-foreground">
                    {t().platformAdmin.usersDescription}
                </p>
            </div>
            <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-muted-foreground">{t().common.comingSoon}</p>
            </div>
        </div>
    );
}
