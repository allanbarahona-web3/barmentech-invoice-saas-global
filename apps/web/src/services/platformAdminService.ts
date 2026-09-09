"use client";

import axios from "axios";
import { getHttpClient } from "@/lib/httpClient";

export interface PlatformAuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        role: "super_admin" | "platform_admin";
    };
}

export interface PlatformTenant {
    id: number;
    name: string;
    slug: string;
    countryCode?: string | null;
    countryPack?: string | null;
    status: "active" | "suspended" | "trial" | "cancelled";
    createdAt: string;
    updatedAt: string;
}

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
    timeout: 10000,
});

export const platformAdminService = {
    async login(email: string, password: string): Promise<PlatformAuthResponse> {
        const response = await api.post<PlatformAuthResponse>("/v1/platform/auth/login", {
            email,
            password,
        });
        return response.data;
    },

    async refresh(refreshToken: string): Promise<{ accessToken: string }> {
        const response = await api.post<{ accessToken: string }>(
            "/v1/platform/auth/refresh",
            { refreshToken },
        );
        return response.data;
    },

    async me(): Promise<{
        id: string;
        email: string;
        role: "super_admin" | "platform_admin";
        status: "active" | "inactive";
        createdAt: string;
    }> {
        const http = getHttpClient();
        const response = await http.post("/v1/platform/auth/me", {});
        return response.data;
    },

    async logout(refreshToken: string): Promise<{ success: true }> {
        const http = getHttpClient();
        const response = await http.post("/v1/platform/auth/logout", {
            refreshToken,
        });
        return response.data;
    },

    async listTenants(): Promise<PlatformTenant[]> {
        const http = getHttpClient();
        const response = await http.get<PlatformTenant[]>("/v1/platform/tenants");
        return response.data;
    },

    async suspendTenant(id: number, reason?: string): Promise<{ success: true }> {
        const http = getHttpClient();
        const response = await http.patch<{ success: true }>(
            `/v1/platform/tenants/${id}/suspend`,
            { reason },
        );
        return response.data;
    },

    async activateTenant(id: number): Promise<{ success: true }> {
        const http = getHttpClient();
        const response = await http.patch<{ success: true }>(
            `/v1/platform/tenants/${id}/activate`,
            {},
        );
        return response.data;
    },
};
