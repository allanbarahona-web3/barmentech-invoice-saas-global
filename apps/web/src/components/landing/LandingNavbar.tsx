"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { t } from "@/i18n";

export function LandingNavbar() {
    return (
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-20 items-center justify-between py-6">
                <div className="flex items-center space-x-2">
                    <Link href="/">
                        <span className="font-bold text-lg cursor-pointer hover:opacity-80 transition-opacity">
                            Barmentech Invoice
                        </span>
                    </Link>
                </div>
                <nav className="hidden md:flex items-center gap-6">
                    <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {t().common.features}
                    </a>
                    <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {t().common.pricing}
                    </a>
                    <a href="#docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {t().common.docs}
                    </a>
                    <LanguageSwitcher />
                    <Link href="/login">
                        <Button variant="ghost" size="sm">
                            {t().auth.loginLink}
                        </Button>
                    </Link>
                    <Link href="/signup">
                        <Button size="sm">
                            {t().auth.signupLink}
                        </Button>
                    </Link>
                </nav>
            </div>
        </header>
    );
}
