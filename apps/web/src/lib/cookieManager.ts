"use client";

/**
 * Client-side cookie manager utilities
 * Note: These functions work only in the browser, not on the server
 */

export function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;

    const nameEQ = name + "=";
    const cookies = document.cookie.split(";");

    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(nameEQ) === 0) {
            return decodeURIComponent(cookie.substring(nameEQ.length));
        }
    }

    return null;
}

export function setCookie(
    name: string,
    value: string,
    options?: {
        maxAge?: number;
        path?: string;
        domain?: string;
        secure?: boolean;
        sameSite?: "Strict" | "Lax" | "None";
    }
): void {
    if (typeof document === "undefined") return;

    let cookieString = `${name}=${encodeURIComponent(value)}`;

    if (options?.maxAge) {
        cookieString += `; max-age=${options.maxAge}`;
    }

    if (options?.path) {
        cookieString += `; path=${options.path}`;
    }

    if (options?.domain) {
        cookieString += `; domain=${options.domain}`;
    }

    if (options?.secure) {
        cookieString += "; secure";
    }

    if (options?.sameSite) {
        cookieString += `; samesite=${options.sameSite}`;
    }

    document.cookie = cookieString;
}

export function deleteCookie(
    name: string,
    options?: {
        path?: string;
        domain?: string;
    }
): void {
    if (typeof document === "undefined") return;

    let cookieString = `${name}=; max-age=0`;

    if (options?.path) {
        cookieString += `; path=${options.path}`;
    }

    if (options?.domain) {
        cookieString += `; domain=${options.domain}`;
    }

    document.cookie = cookieString;
}
