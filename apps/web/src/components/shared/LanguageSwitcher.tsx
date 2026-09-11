"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { type Locale, useTranslations } from "@/i18n";

export function LanguageSwitcher() {
    const { locale: currentLocale, messages, setLocale } = useTranslations();

    const handleLocaleChange = (locale: Locale) => {
        setLocale(locale);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2" aria-label={messages.common.language}>
                    <Globe className="w-4 h-4" />
                    <span className="text-xs uppercase">{currentLocale}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => handleLocaleChange("es")}
                    className={currentLocale === "es" ? "bg-accent" : ""}
                >
                    {messages.common.languageSpanish}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleLocaleChange("en")}
                    className={currentLocale === "en" ? "bg-accent" : ""}
                >
                    {messages.common.languageEnglish}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
