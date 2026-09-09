"use client";

import { getCookie, setCookie, deleteCookie } from "./cookieManager";
import { Role } from "./rbacEngine";

const TOKEN_COOKIE_NAME = "accessToken";
const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
const ROLE_COOKIE_NAME = "role";
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

/**
 * Get the access token from cookies
 */
export function getAccessToken(): string | null {
    return getCookie(TOKEN_COOKIE_NAME);
}

/**
 * Set the access token in cookies
 */
export function setAccessToken(token: string): void {
    setCookie(TOKEN_COOKIE_NAME, token, {
        maxAge: TOKEN_MAX_AGE,
        path: "/",
        secure: true,
        sameSite: "Lax",
    });
}

/**
 * Get the refresh token from cookies
 */
export function getRefreshToken(): string | null {
    return getCookie(REFRESH_TOKEN_COOKIE_NAME);
}

/**
 * Set the refresh token in cookies
 */
export function setRefreshToken(token: string): void {
    setCookie(REFRESH_TOKEN_COOKIE_NAME, token, {
        maxAge: TOKEN_MAX_AGE,
        path: "/",
        secure: true,
        sameSite: "Lax",
    });
}

/**
 * Delete refresh token from cookies
 */
export function deleteRefreshToken(): void {
    deleteCookie(REFRESH_TOKEN_COOKIE_NAME, { path: "/" });
}

/**
 * Delete the access token from cookies
 */
export function deleteAccessToken(): void {
    deleteCookie(TOKEN_COOKIE_NAME, { path: "/" });
}

/**
 * Get the user role from cookies
 */
export function getRole(): Role | null {
    const role = getCookie(ROLE_COOKIE_NAME);
    if (!role || !Object.values(Role).includes(role as Role)) {
        return null;
    }
    return role as Role;
}

/**
 * Set the user role in cookies
 */
export function setRole(role: Role): void {
    setCookie(ROLE_COOKIE_NAME, role, {
        maxAge: TOKEN_MAX_AGE,
        path: "/",
        secure: true,
        sameSite: "Lax",
    });
}

/**
 * Delete the user role from cookies
 */
export function deleteRole(): void {
    deleteCookie(ROLE_COOKIE_NAME, { path: "/" });
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    const token = getAccessToken();
    return !!token;
}

/**
 * Clear all auth data (token + role)
 */
export function clearAuthContext(): void {
    deleteAccessToken();
    deleteRefreshToken();
    deleteRole();
}
