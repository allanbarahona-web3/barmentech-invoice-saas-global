"use client";

import { usePathname } from "next/navigation";
import { TenantSidebar } from "@/components/system/TenantSidebar";
import { TenantHeader } from "@/components/system/TenantHeader";
import { TenantSystemGuard } from "@/lib/routeGuards";
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
            <LayoutContent>{children}</LayoutContent>
        </TenantSystemGuard>
    );
}
