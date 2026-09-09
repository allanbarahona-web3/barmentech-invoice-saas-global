"use client";

import axios, { AxiosInstance, AxiosError } from "axios";
import { getAccessToken, clearAuthContext, getRole } from "./authContext";
import { getTenantId, getTenantSlug, clearTenantContext } from "./tenantContext";
import { Role } from "./rbacEngine";

let httpClientInstance: AxiosInstance | null = null;

/**
 * Get or create the HTTP client instance
 * This is a singleton pattern to ensure only one instance exists
 * Only works on client-side due to cookie and window access
 */
export function getHttpClient(): AxiosInstance {
    if (httpClientInstance) {
        return httpClientInstance;
    }

    httpClientInstance = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
        timeout: 10000,
    });

    /**
     * Request interceptor
     * Adds authentication and tenant headers
     */
    httpClientInstance.interceptors.request.use(
        (config) => {
            // Add authorization token if exists
            const token = getAccessToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            // Add tenant context headers if exists
            const tenantId = getTenantId();
            const tenantSlug = getTenantSlug();

            if (tenantId) {
                config.headers["X-Tenant-Id"] = tenantId;
            }

            if (tenantSlug) {
                config.headers["X-Tenant-Slug"] = tenantSlug;
            }

            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    /**
     * Response interceptor
     * Handles authentication errors and clears auth state
     */
    httpClientInstance.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
            // Handle 401 Unauthorized
            if (error.response?.status === 401) {
                // Only execute in browser environment
                if (typeof window !== "undefined") {
                    // Clear auth and tenant context
                    clearAuthContext();
                    clearTenantContext();

                    // Redirect based on role/context
                    const role = getRole();
                    if (role === Role.SUPER_ADMIN || window.location.pathname.startsWith('/platform-admin')) {
                        window.location.href = "/platform-admin/login";
                    } else {
                        window.location.href = "/login";
                    }
                }
            }

            // Handle 403 Forbidden (role-based)
            if (error.response?.status === 403) {
                if (typeof window !== "undefined") {
                    window.location.href = "/";
                }
            }

            return Promise.reject(error);
        }
    );

    return httpClientInstance;
}

/**
 * Reset the HTTP client instance
 * Useful for testing or when auth state changes
 */
export function resetHttpClient(): void {
    httpClientInstance = null;
}

export default getHttpClient;
