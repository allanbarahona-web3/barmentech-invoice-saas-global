"use client";

import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { t } from "@/i18n";

export default function LandingPage() {
    return (
        <div className="space-y-0">
            <div className="container max-w-6xl mx-auto">
                <LandingHero />
                <LandingFeatures />
                <LandingPricing />
                <LandingFAQ />
            </div>

            <section className="border-t mt-20 md:mt-32 py-20 md:py-24 bg-muted/30">
                <div className="container max-w-6xl mx-auto text-center space-y-6">
                    <h2 className="text-3xl md:text-4xl font-bold">
                        {t().landing.readyTitle}
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        {t().landing.readyDescription}
                    </p>
                </div>
            </section>
        </div>
    );
}
