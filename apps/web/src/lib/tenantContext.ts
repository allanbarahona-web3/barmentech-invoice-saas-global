"use client";

import { getCookie, setCookie, deleteCookie } from "./cookieManager";

const TENANT_ID_COOKIE_NAME = "tenantId";
const TENANT_SLUG_COOKIE_NAME = "tenantSlug";
const TENANT_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

/**
 * Get the tenant ID from cookies
 */
export function getTenantId(): string | null {
    return getCookie(TENANT_ID_COOKIE_NAME);
}

/**
 * Set the tenant ID in cookies
 */
export function setTenantId(tenantId: string): void {
    setCookie(TENANT_ID_COOKIE_NAME, tenantId, {
        maxAge: TENANT_MAX_AGE,
        path: "/",
        secure: true,
        sameSite: "Lax",
    });
}

/**
 * Delete the tenant ID from cookies
 */
export function deleteTenantId(): void {
    deleteCookie(TENANT_ID_COOKIE_NAME, { path: "/" });
}

/**
 * Get the tenant slug from cookies
 */
export function getTenantSlug(): string | null {
    return getCookie(TENANT_SLUG_COOKIE_NAME);
}

/**
 * Set the tenant slug in cookies
 */
export function setTenantSlug(tenantSlug: string): void {
    setCookie(TENANT_SLUG_COOKIE_NAME, tenantSlug, {
        maxAge: TENANT_MAX_AGE,
        path: "/",
        secure: true,
        sameSite: "Lax",
    });
}

/**
 * Delete the tenant slug from cookies
 */
export function deleteTenantSlug(): void {
    deleteCookie(TENANT_SLUG_COOKIE_NAME, { path: "/" });
}

/**
 * Get tenant context (both ID and slug)
 */
export function getTenantContext(): {
    tenantId: string | null;
    tenantSlug: string | null;
} {
    return {
        tenantId: getTenantId(),
        tenantSlug: getTenantSlug(),
    };
}

/**
 * Set tenant context (both ID and slug)
 */
export function setTenantContext(tenantId: string, tenantSlug: string): void {
    setTenantId(tenantId);
    setTenantSlug(tenantSlug);
}

/**
 * Clear all tenant context
 */
export function clearTenantContext(): void {
    deleteTenantId();
    deleteTenantSlug();
}
