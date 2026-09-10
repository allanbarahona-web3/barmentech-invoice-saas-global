"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isTenantRole, useAuth } from "./authContext";

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
    const { isAuthenticated, isLoading, role } = useAuth();
    const isAuthorized = isAuthenticated && isTenantRole(role);

    useEffect(() => {
        if (isLoading) {
            return;
        }

        if (!isAuthenticated) {
            router.replace(fallbackPath);
            return;
        }

        if (!isTenantRole(role)) {
            router.replace("/platform-admin/dashboard");
        }
    }, [fallbackPath, isAuthenticated, isLoading, role, router]);

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
    const { isAuthenticated, isLoading, role } = useAuth();
    const isAuthorized = isAuthenticated && role === "SUPER_ADMIN";

    useEffect(() => {
        if (isLoading) {
            return;
        }

        // Not authenticated
        if (!isAuthenticated) {
            router.replace(fallbackPath);
            return;
        }

        // Has authentication but not SUPER_ADMIN role
        if (role !== "SUPER_ADMIN") {
            router.replace("/system/dashboard");
            return;
        }
    }, [fallbackPath, isAuthenticated, isLoading, role, router]);

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
