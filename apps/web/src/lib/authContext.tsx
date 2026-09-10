"use client";

import axios from "axios";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { clearTenantContext } from "./tenantContext";
import {
    AUTH_SESSION_INVALIDATED_EVENT,
    getHttpClient,
    resetHttpClient,
} from "./httpClient";
import { queryClient } from "./queryClient";

export const AUTH_ROLES = [
    "ADMIN",
    "BILLING_USER",
    "ACCOUNTANT",
    "SUPER_ADMIN",
] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];

export type AuthenticatedUser = {
    id: string;
    email: string;
    fullName: string;
    role: AuthRole;
    tenantId: string | null;
    tenantName?: string | null;
};

type Credentials = {
    email: string;
    password: string;
};

type AuthContextValue = {
    user: AuthenticatedUser | null;
    role: AuthRole | null;
    tenantId: string | null;
    tenantName: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: Credentials) => Promise<AuthenticatedUser>;
    superAdminLogin: (credentials: Credentials) => Promise<AuthenticatedUser>;
    logout: () => Promise<void>;
    refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAuthenticatedUser(value: unknown): AuthenticatedUser | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const user = value as Record<string, unknown>;

    if (
        typeof user.id !== "string" ||
        typeof user.email !== "string" ||
        typeof user.fullName !== "string" ||
        typeof user.role !== "string" ||
        !AUTH_ROLES.includes(user.role as AuthRole) ||
        (user.tenantId !== null && typeof user.tenantId !== "string")
    ) {
        return null;
    }

    return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role as AuthRole,
        tenantId: user.tenantId as string | null,
        tenantName: typeof user.tenantName === "string" ? user.tenantName : null,
    };
}

export function isTenantRole(
    role: AuthRole | null,
): role is Exclude<AuthRole, "SUPER_ADMIN"> {
    return role === "ADMIN" || role === "BILLING_USER" || role === "ACCOUNTANT";
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthenticatedUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const clearSession = useCallback(() => {
        setUser(null);
        clearTenantContext();
        queryClient.clear();
        resetHttpClient();
    }, []);

    const refreshSession = useCallback(async () => {
        setIsLoading(true);

        try {
            const response = await getHttpClient().get("/auth/me");
            const verifiedUser = toAuthenticatedUser(response.data);

            if (!verifiedUser) {
                clearSession();
                return;
            }

            setUser((currentUser) => ({
                ...verifiedUser,
                tenantName:
                    verifiedUser.tenantName ??
                    (currentUser?.id === verifiedUser.id
                        ? currentUser.tenantName
                        : null),
            }));
        } catch {
            clearSession();
        } finally {
            setIsLoading(false);
        }
    }, [clearSession]);

    const authenticate = useCallback(
        async (path: string, credentials: Credentials): Promise<AuthenticatedUser> => {
            const response = await getHttpClient().post(path, credentials);
            const verifiedUser = toAuthenticatedUser(response.data?.user);

            if (!verifiedUser) {
                throw new Error("Invalid authentication response");
            }

            clearTenantContext();
            queryClient.clear();
            setUser(verifiedUser);

            return verifiedUser;
        },
        [],
    );

    const login = useCallback(
        (credentials: Credentials) => authenticate("/auth/login", credentials),
        [authenticate],
    );

    const superAdminLogin = useCallback(
        (credentials: Credentials) =>
            authenticate("/auth/super-admin/login", credentials),
        [authenticate],
    );

    const logout = useCallback(async () => {
        try {
            await getHttpClient().post("/auth/logout");
        } catch (error) {
            if (!axios.isAxiosError(error) || error.response?.status !== 401) {
                throw error;
            }
        } finally {
            clearSession();
        }
    }, [clearSession]);

    useEffect(() => {
        void refreshSession();

        const handleSessionInvalidation = () => {
            clearSession();
            setIsLoading(false);
        };

        window.addEventListener(AUTH_SESSION_INVALIDATED_EVENT, handleSessionInvalidation);

        return () => {
            window.removeEventListener(
                AUTH_SESSION_INVALIDATED_EVENT,
                handleSessionInvalidation,
            );
        };
    }, [clearSession, refreshSession]);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            role: user?.role ?? null,
            tenantId: user?.tenantId ?? null,
            tenantName: user?.tenantName ?? null,
            isLoading,
            isAuthenticated: Boolean(user),
            login,
            superAdminLogin,
            logout,
            refreshSession,
        }),
        [isLoading, login, logout, refreshSession, superAdminLogin, user],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }

    return context;
}
