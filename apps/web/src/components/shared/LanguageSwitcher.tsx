"use client";

import { useEffect, useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { setLocale, type Locale } from "@/i18n";

export function LanguageSwitcher() {
    const [currentLocale, setCurrentLocale] = useState<Locale>("es");

    useEffect(() => {
        // Read current locale from cookie
        if (typeof window !== "undefined") {
            const cookies = document.cookie.split("; ");
            const localeCookie = cookies.find((c) => c.startsWith("locale="));
            
            if (localeCookie) {
                const value = localeCookie.split("=")[1] as Locale;
                if (value === "es" || value === "en") {
                    setCurrentLocale(value);
                }
            }
        }
    }, []);

    const handleLocaleChange = (locale: Locale) => {
        setLocale(locale);
        window.location.reload(); // Refresh to apply translations
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <Globe className="w-4 h-4" />
                    <span className="text-xs uppercase">{currentLocale}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => handleLocaleChange("es")}
                    className={currentLocale === "es" ? "bg-accent" : ""}
                >
                    🇪🇸 Español
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleLocaleChange("en")}
                    className={currentLocale === "en" ? "bg-accent" : ""}
                >
                    🇺🇸 English
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
