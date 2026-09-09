"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, getRole, deleteAccessToken, deleteRole } from "./authContext";
import { clearTenantContext } from "./tenantContext";
import { Role, canAccess } from "./rbacEngine";

interface RouteGuardProps {
    children: ReactNode;
    fallbackPath?: string;
}

/**
 * Guard component for Tenant System routes
 * Redirects to login if not authenticated
 */
export function TenantSystemGuard({
    children,
    fallbackPath = "/login",
}: RouteGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthed, setIsAuthed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const authenticated = isAuthenticated();

        if (!authenticated) {
            // Store the intended destination
            sessionStorage.setItem("redirectAfterLogin", pathname);
            router.push(fallbackPath);
        }

        setIsAuthed(authenticated);
        setIsLoading(false);
    }, [router, pathname, fallbackPath]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    if (!isAuthed) {
        return null;
    }

    return <>{children}</>;
}

/**
 * Guard component for Platform Admin routes
 * Redirects to login if not authenticated
 * Redirects to /system/dashboard if not SUPER_ADMIN role
 */
export function PlatformAdminGuard({
    children,
    fallbackPath = "/login",
}: RouteGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const authenticated = isAuthenticated();
        const role = getRole();

        // Not authenticated
        if (!authenticated) {
            sessionStorage.setItem("redirectAfterLogin", pathname);
            router.push(fallbackPath);
            setIsLoading(false);
            return;
        }

        // Has authentication but not SUPER_ADMIN role
        if (role !== Role.SUPER_ADMIN) {
            router.push("/system/dashboard");
            setIsLoading(false);
            return;
        }

        // Authorized
        setIsAuthorized(true);
        setIsLoading(false);
    }, [router, pathname, fallbackPath]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    return <>{children}</>;
}
