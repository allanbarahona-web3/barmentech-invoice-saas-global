"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, LogOut, Shield } from "lucide-react";
import { clearAuthContext, getRefreshToken, getRole } from "@/lib/authContext";
import { clearTenantContext } from "@/lib/tenantContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getRoleDisplayName } from "@/lib/rbacEngine";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { t } from "@/i18n";
import { platformAdminService } from "@/services/platformAdminService";

export function PlatformHeader() {
    const router = useRouter();
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const userRole = getRole();
        if (userRole) {
            setRole(getRoleDisplayName(userRole));
        }
    }, []);

    const handleLogout = async () => {
        const refreshToken = getRefreshToken();

        if (refreshToken) {
            try {
                await platformAdminService.logout(refreshToken);
            } catch {
                // Ignore network/logout errors and clear local auth anyway.
            }
        }

        clearAuthContext();
        clearTenantContext();
        router.push("/platform-admin/login");
    };

    return (
        <header className="border-b bg-background px-6 py-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{t().common.dashboard}</h1>
                        <Badge variant="secondary" className="gap-1">
                            <Shield className="w-3 h-3" />
                            Platform Admin
                        </Badge>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2 w-48">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder={t().common.search}
                            className="bg-transparent border-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    </div>

                    <LanguageSwitcher />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                Environment
                                <ChevronDown className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <div className="px-2 py-1.5">
                                <p className="text-xs text-muted-foreground font-semibold">
                                    ENVIRONMENT
                                </p>
                                <p className="text-sm font-medium">Production</p>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled>
                                {t().platformAdmin.switchEnvironment}
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
                                    A
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem disabled>Profile</DropdownMenuItem>
                            <DropdownMenuItem disabled>{t().common.settings}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
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
