"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Users, Package, Settings, LayoutDashboard, Sparkles, BarChart3, Wallet } from "lucide-react";
import { useMemo } from "react";
import { isTenantRole, useAuth } from "@/lib/authContext";
import { canAccess, Role } from "@/lib/rbacEngine";
import { useTranslations } from "@/i18n";

const getSidebarLinks = (messages: ReturnType<typeof useTranslations>["messages"]) => [
    {
        label: messages.system.dashboard,
        href: "/system/dashboard",
        icon: LayoutDashboard,
        route: "dashboard",
    },
    {
        label: messages.system.invoices,
        href: "/system/invoices",
        icon: FileText,
        route: "invoices",
    },
    {
        label: messages.system.customers,
        href: "/system/customers",
        icon: Users,
        route: "customers",
    },
    {
        label: messages.system.products,
        href: "/system/products",
        icon: Package,
        route: "products",
    },
    {
        label: messages.shell.payments,
        href: "/system/payments",
        icon: Wallet,
        route: "payments",
    },
    {
        label: messages.shell.reports,
        href: "/system/reports",
        icon: BarChart3,
        route: "reports",
    },
    {
        label: messages.system.settings,
        href: "/system/settings",
        icon: Settings,
        route: "settings",
    },
];

export function TenantSidebar() {
    const pathname = usePathname();
    const { role } = useAuth();
    const { messages } = useTranslations();
    const rbacRole = isTenantRole(role) ? Role[role] : null;
    const visibleLinks = useMemo(() => {
        const links = getSidebarLinks(messages);
        return links.filter((link) =>
            canAccess({
                area: "system",
                route: link.route,
                role: rbacRole,
            })
        );
    }, [messages, rbacRole]);

    return (
        <aside className="w-64 border-r bg-background p-6 no-print flex flex-col h-screen sticky top-0">
            <div className="space-y-8 flex-1">
                <div>
                    <h2 className="font-bold text-lg">Barmentech</h2>
                    <p className="text-xs text-muted-foreground">{messages.shell.invoiceSystem}</p>
                    {role && (
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                            {role === "BILLING_USER" && "💳"}
                            {role === "ACCOUNTANT" && "📊"}
                            {role === "ADMIN" && "👤"}
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
                                    {messages.shell.premiumFeatures}
                                </p>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight mb-2">
                            {messages.shell.premiumDescription}
                        </p>
                        <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            {messages.shell.seeMore}
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
