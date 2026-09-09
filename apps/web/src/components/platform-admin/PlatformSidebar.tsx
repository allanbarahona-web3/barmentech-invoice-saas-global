"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Users, Package, FileText, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { getRole } from "@/lib/authContext";
import { Role } from "@/lib/rbacEngine";
import { t } from "@/i18n";

const getSidebarLinks = () => [
    {
        label: t().platformAdmin.dashboard,
        href: "/platform-admin/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: t().platformAdmin.tenants,
        href: "/platform-admin/tenants",
        icon: Building2,
    },
    {
        label: t().platformAdmin.users,
        href: "/platform-admin/users",
        icon: Users,
    },
    {
        label: t().platformAdmin.plans,
        href: "/platform-admin/plans",
        icon: Package,
    },
    {
        label: t().platformAdmin.audit,
        href: "/platform-admin/audit",
        icon: FileText,
    },
    {
        label: t().platformAdmin.settings,
        href: "/platform-admin/settings",
        icon: Settings,
    },
];

export function PlatformSidebar() {
    const pathname = usePathname();
    const sidebarLinks = getSidebarLinks();
    const [role, setRole] = useState<Role | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const userRole = getRole();
        setRole(userRole);
        setIsLoading(false);
    }, []);

    // Only display sidebar if user is SUPER_ADMIN
    if (isLoading) {
        return <div className="w-64 border-r bg-background p-6"></div>;
    }

    if (role !== Role.SUPER_ADMIN) {
        return (
            <aside className="w-64 border-r bg-background p-6">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-2">
                        <p className="text-sm font-semibold text-muted-foreground">
                            Access Denied
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Super Admin only
                        </p>
                    </div>
                </div>
            </aside>
        );
    }

    return (
        <aside className="w-64 border-r bg-background p-6">
            <div className="space-y-8">
                <div>
                    <h2 className="font-bold text-lg">Platform Admin</h2>
                    <p className="text-xs text-muted-foreground">Control Center</p>
                    <div className="mt-2 inline-block rounded-full bg-red-100 dark:bg-red-950/30 px-2 py-1">
                        <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                            🔒 SUPER_ADMIN
                        </p>
                    </div>
                </div>

                <nav className="space-y-2">
                    {sidebarLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;

                        return (
                            <Link key={link.href} href={link.href}>
                                <div
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                        isActive
                                            ? "bg-accent text-accent-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{link.label}</span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
