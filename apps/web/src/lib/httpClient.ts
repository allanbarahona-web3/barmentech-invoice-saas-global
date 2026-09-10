"use client";

import axios, { AxiosError, AxiosInstance } from "axios";

let httpClientInstance: AxiosInstance | null = null;
export const AUTH_SESSION_INVALIDATED_EVENT = "auth-session-invalidated";

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
        baseURL: "/api",
        timeout: 10000,
        withCredentials: true,
    });

    httpClientInstance.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
            if (error.response?.status === 401) {
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event(AUTH_SESSION_INVALIDATED_EVENT));
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
