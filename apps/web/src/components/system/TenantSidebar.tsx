"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Users, Package, Settings, LayoutDashboard, Sparkles, BarChart3, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { getRole } from "@/lib/authContext";
import { canAccess, Role } from "@/lib/rbacEngine";
import { t } from "@/i18n";

const getSidebarLinks = () => [
    {
        label: t().system.dashboard,
        href: "/system/dashboard",
        icon: LayoutDashboard,
        route: "dashboard",
    },
    {
        label: t().system.invoices,
        href: "/system/invoices",
        icon: FileText,
        route: "invoices",
    },
    {
        label: t().system.customers,
        href: "/system/customers",
        icon: Users,
        route: "customers",
    },
    {
        label: t().system.products,
        href: "/system/products",
        icon: Package,
        route: "products",
    },
    {
        label: "Pagos",
        href: "/system/payments",
        icon: Wallet,
        route: "payments",
    },
    {
        label: "Reportes",
        href: "/system/reports",
        icon: BarChart3,
        route: "reports",
    },
    {
        label: t().system.settings,
        href: "/system/settings",
        icon: Settings,
        route: "settings",
    },
];

export function TenantSidebar() {
    const pathname = usePathname();
    const sidebarLinks = getSidebarLinks();
    const [visibleLinks, setVisibleLinks] = useState(sidebarLinks);
    const [role, setRole] = useState<Role | null>(null);

    useEffect(() => {
        const userRole = getRole();
        setRole(userRole);
        const links = getSidebarLinks();

        // Filter links based on role
        const filtered = links.filter((link) =>
            canAccess({
                area: "system",
                route: link.route,
                role: userRole,
            })
        );

        setVisibleLinks(filtered);
    }, []);

    return (
        <aside className="w-64 border-r bg-background p-6 no-print flex flex-col h-screen sticky top-0">
            <div className="space-y-8 flex-1">
                <div>
                    <h2 className="font-bold text-lg">Barmentech</h2>
                    <p className="text-xs text-muted-foreground">Invoice System</p>
                    {role && (
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                            {role === "VIEWER" && "📖"}
                            {role === "ACCOUNTANT" && "📊"}
                            {role === "TENANT_ADMIN" && "👤"}
                            {role}
                        </p>
                    )}
                </div>

                <nav className="space-y-2">
                    {visibleLinks.map((link) => {
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

                {role === Role.VIEWER && (
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
                        <p className="text-xs text-amber-800 dark:text-amber-200">
                            You have <strong>view-only</strong> access to this workspace.
                        </p>
                    </div>
                )}
            </div>

            {/* Premium Features Card - Fixed at bottom */}
            <div className="mt-auto pt-4 border-t">
                <Link href="/system/settings/features">
                    <div className="rounded-lg bg-gradient-to-br from-amber-500/10 to-purple-600/10 border-2 border-amber-500/30 hover:border-amber-500/50 p-4 transition-all hover:scale-[1.02] cursor-pointer">
                        <div className="flex items-start gap-2 mb-2">
                            <div className="p-1.5 rounded-md bg-gradient-to-r from-amber-500 to-purple-600">
                                <Sparkles className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-foreground">
                                    Características Premium
                                </p>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight mb-2">
                            Automatiza facturas recurrentes y envíos programados
                        </p>
                        <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            Ver más
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </Link>
            </div>
        </aside>
    );
}
