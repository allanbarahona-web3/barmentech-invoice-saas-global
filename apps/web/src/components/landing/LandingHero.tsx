"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { t } from "@/i18n";

export function LandingHero() {
    return (
        <section className="space-y-8 py-20 md:py-32 lg:py-40">
            <div className="space-y-6 text-center">
                <div className="inline-block">
                    <span className="rounded-full border border-foreground/20 px-4 py-1.5 text-sm font-medium">
                        {t().landing.heroTagline}
                    </span>
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                    {t().landing.heroTitle}
                    <br />
                    <span className="text-muted-foreground">{t().landing.heroSubtitle}</span>
                </h1>

                <p className="mx-auto max-w-2xl text-xl text-muted-foreground leading-relaxed">
                    {t().landing.heroDescription}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                <Link href="/signup">
                    <Button size="lg" className="px-8 py-6 text-base">
                        {t().landing.ctaPrimary}
                    </Button>
                </Link>
                <Link href="#features">
                    <Button variant="outline" size="lg" className="px-8 py-6 text-base">
                        {t().landing.ctaSecondary}
                    </Button>
                </Link>
            </div>

            <div className="pt-12">
                <div className="h-96 w-full bg-gradient-to-br from-muted to-muted/50 rounded-2xl"></div>
            </div>
        </section>
    );
}
