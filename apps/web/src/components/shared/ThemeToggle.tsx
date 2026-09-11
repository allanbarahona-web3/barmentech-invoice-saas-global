"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n";

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const { messages } = useTranslations();

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={messages.common.themeToggle}
            title={messages.common.themeToggle}
            onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
        >
            <Sun className="size-4 dark:hidden" />
            <Moon className="hidden size-4 dark:block" />
        </Button>
    );
}
