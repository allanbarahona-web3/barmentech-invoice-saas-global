"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { t } from "@/i18n";
import { getActivePlans } from "@/modules/billing/plans";

export function LandingPricing() {
    const translations = t();
    const activePlans = getActivePlans();
    
    // Helper para obtener traducción anidada por path "plans.starter.name"
    const getTranslation = (path: string): string => {
        const keys = path.split('.');
        let value: any = translations;
        for (const key of keys) {
            value = value?.[key];
        }
        return value || path;
    };

    return (
        <section className="space-y-16 py-20 md:py-32">
            <div className="space-y-4 text-center">
                <Badge variant="outline" className="mx-auto">{translations.landing.pricing}</Badge>
                <h2 className="text-4xl md:text-5xl font-bold">
                    {translations.landing.pricingTitle}
                </h2>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                    {translations.landing.pricingDescription}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-12">
                {activePlans.map((plan) => (
                    <Card
                        key={plan.id}
                        className={`relative flex flex-col p-6 ${
                            plan.highlighted ? "ring-2 ring-primary md:scale-105" : ""
                        }`}
                    >
                        {plan.badge && (
                            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                                {getTranslation(plan.badge)}
                            </Badge>
                        )}

                        <div className="space-y-2 mb-4 pt-2">
                            <h3 className="text-xl font-bold">
                                {getTranslation(plan.name)}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {getTranslation(plan.description)}
                            </p>
                        </div>

                        <div className="mb-4">
                            {plan.monthlyPrice === 0 ? (
                                <span className="text-3xl font-bold">
                                    {translations.plans.freeLabel}
                                </span>
                            ) : (
                                <>
                                    <span className="text-3xl font-bold">
                                        ${plan.monthlyPrice}
                                    </span>
                                    <span className="text-sm text-muted-foreground">/{translations.plans.month}</span>
                                </>
                            )}
                        </div>

                        <Button
                            className="mb-6 w-full"
                            size="sm"
                            variant={plan.highlighted ? "default" : "outline"}
                        >
                            {getTranslation(plan.ctaLabel)}
                        </Button>

                        <div className="space-y-3">
                            {plan.features.map((featureKey, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-xs">
                                        {getTranslation(featureKey)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
        </section>
    );
}
