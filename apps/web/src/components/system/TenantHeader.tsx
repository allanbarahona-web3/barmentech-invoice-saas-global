"use client";

import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { getTenantSlug } from "@/lib/tenantContext";
import { clearAuthContext } from "@/lib/authContext";
import { clearTenantContext } from "@/lib/tenantContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { t } from "@/i18n";
import Link from "next/link";

export function TenantHeader() {
    const router = useRouter();
    const [tenantSlug, setTenantSlug] = useState<string | null>(null);

    useEffect(() => {
        setTenantSlug(getTenantSlug());
    }, []);

    const handleLogout = () => {
        clearAuthContext();
        clearTenantContext();
        router.push("/login");
    };

    return (
        <header className="border-b bg-background px-6 py-4 no-print">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">{t().common.dashboard}</h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2 w-48">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            className="bg-transparent border-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                {tenantSlug || "Tenant"}
                                <ChevronDown className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <div className="px-2 py-1.5">
                                <p className="text-xs text-muted-foreground font-semibold">
                                    CURRENT TENANT
                                </p>
                                <p className="text-sm font-medium truncate">
                                    {tenantSlug}
                                </p>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled>
                                Switch Tenant (Coming soon)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full w-10 h-10 p-0"
                            >
                                <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                                    U
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                                <Link href="/system/profile" className="cursor-pointer">
                                    <User className="w-4 h-4 mr-2" />
                                    Perfil
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/system/settings" className="cursor-pointer">
                                    <Settings className="w-4 h-4 mr-2" />
                                    {t().common.settings}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                {t().common.logout}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}

