"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/lib/authContext";
import { I18nProvider } from "@/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <I18nProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <NextThemesProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem={false}
                    disableTransitionOnChange
                >
                    {children}
                </NextThemesProvider>
            </AuthProvider>
          </QueryClientProvider>
        </I18nProvider>
    );
}
