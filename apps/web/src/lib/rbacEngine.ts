"use client";

/**
 * Role-Based Access Control (RBAC) Engine
 * Defines roles, permissions, and access control logic
 */

export enum Role {
    SUPER_ADMIN = "SUPER_ADMIN",
    TENANT_ADMIN = "TENANT_ADMIN",
    ACCOUNTANT = "ACCOUNTANT",
    VIEWER = "VIEWER",
}

export type Area = "system" | "platform-admin";

interface PermissionRule {
    [key: string]: Role[];
}

/**
 * Permission matrix defining which roles can access which routes
 */
const permissionMatrix: Record<Area, PermissionRule> = {
    system: {
        dashboard: [
            Role.SUPER_ADMIN,
            Role.TENANT_ADMIN,
            Role.ACCOUNTANT,
            Role.VIEWER,
        ],
        invoices: [Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.ACCOUNTANT],
        customers: [Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.ACCOUNTANT],
        products: [Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.ACCOUNTANT],
        reports: [
            Role.SUPER_ADMIN,
            Role.TENANT_ADMIN,
            Role.ACCOUNTANT,
            Role.VIEWER,
        ],
        settings: [Role.SUPER_ADMIN, Role.TENANT_ADMIN],
    },
    "platform-admin": {
        dashboard: [Role.SUPER_ADMIN],
        tenants: [Role.SUPER_ADMIN],
        users: [Role.SUPER_ADMIN],
        plans: [Role.SUPER_ADMIN],
        audit: [Role.SUPER_ADMIN],
        settings: [Role.SUPER_ADMIN],
    },
};

/**
 * Check if a role can access a specific area and route
 */
export function canAccess({
    area,
    route,
    role,
}: {
    area: Area;
    route: string;
    role: Role | null;
}): boolean {
    // No role = no access
    if (!role) {
        return false;
    }

    // Check if area exists
    if (!permissionMatrix[area]) {
        return false;
    }

    // Check if route exists in the area
    const allowedRoles = permissionMatrix[area][route];
    if (!allowedRoles) {
        return false;
    }

    // Check if user's role is in allowed roles
    return allowedRoles.includes(role);
}

/**
 * Get all accessible features for a role
 */
export function getAccessibleFeatures(role: Role | null): {
    canViewSystem: boolean;
    canEditInvoices: boolean;
    canManageCustomers: boolean;
    canAccessAdmin: boolean;
    canManageTenants: boolean;
    canViewAudit: boolean;
} {
    if (!role) {
        return {
            canViewSystem: false,
            canEditInvoices: false,
            canManageCustomers: false,
            canAccessAdmin: false,
            canManageTenants: false,
            canViewAudit: false,
        };
    }

    return {
        canViewSystem: canAccess({
            area: "system",
            route: "dashboard",
            role,
        }),
        canEditInvoices: canAccess({
            area: "system",
            route: "invoices",
            role,
        }),
        canManageCustomers: canAccess({
            area: "system",
            route: "customers",
            role,
        }),
        canAccessAdmin: canAccess({
            area: "platform-admin",
            route: "dashboard",
            role,
        }),
        canManageTenants: canAccess({
            area: "platform-admin",
            route: "tenants",
            role,
        }),
        canViewAudit: canAccess({
            area: "platform-admin",
            route: "audit",
            role,
        }),
    };
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: Role): string {
    const names: Record<Role, string> = {
        [Role.SUPER_ADMIN]: "Super Admin",
        [Role.TENANT_ADMIN]: "Tenant Admin",
        [Role.ACCOUNTANT]: "Accountant",
        [Role.VIEWER]: "Viewer",
    };
    return names[role];
}
