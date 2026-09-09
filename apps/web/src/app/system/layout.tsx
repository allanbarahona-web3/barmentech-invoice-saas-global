"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TenantSidebar } from "@/components/system/TenantSidebar";
import { TenantHeader } from "@/components/system/TenantHeader";
import { TenantSystemGuard } from "@/lib/routeGuards";
import { useTenantSettingsQuery } from "@/hooks/useTenantSettings";
import { Loader2 } from "lucide-react";
import { t } from "@/i18n";

function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: settings, isLoading } = useTenantSettingsQuery();

    useEffect(() => {
        if (isLoading) return;

        const isOnboardingPage = pathname === "/system/onboarding";
        const onboardingCompleted = settings?.onboardingCompleted ?? false;

        // Si no está completo y no estamos en onboarding, redirigir
        if (!onboardingCompleted && !isOnboardingPage) {
            router.push("/system/onboarding");
        }

        // Si está completo y estamos en onboarding, redirigir al dashboard
        if (onboardingCompleted && isOnboardingPage) {
            router.push("/system/dashboard");
        }
    }, [settings, pathname, router, isLoading]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">{t().system.onboarding.loadingSettings}</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isOnboardingPage = pathname === "/system/onboarding";

    // Si estamos en onboarding, no mostrar sidebar/header
    if (isOnboardingPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen bg-background print:block print:min-h-0">
            <TenantSidebar />
            <div className="flex flex-1 flex-col print:block">
                <TenantHeader />
                <main className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function TenantSystemLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <TenantSystemGuard>
            <OnboardingGuard>
                <LayoutContent>{children}</LayoutContent>
            </OnboardingGuard>
        </TenantSystemGuard>
    );
}
