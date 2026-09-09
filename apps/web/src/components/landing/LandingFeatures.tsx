"use client";

import { Badge } from "@/components/ui/badge";
import { FileText, BarChart3, Lock, Zap, Users, Globe } from "lucide-react";
import { t } from "@/i18n";

const features = [
    {
        icon: FileText,
        title: "feature1Title",
        description: "feature1Description",
    },
    {
        icon: BarChart3,
        title: "feature2Title",
        description: "feature2Description",
    },
    {
        icon: Lock,
        title: "feature3Title",
        description: "feature3Description",
    },
    {
        icon: Zap,
        title: "feature4Title",
        description: "feature4Description",
    },
    {
        icon: Users,
        title: "feature5Title",
        description: "feature5Description",
    },
    {
        icon: Globe,
        title: "feature6Title",
        description: "feature6Description",
    },
];

export function LandingFeatures() {
    const translations = t().landing;
    
    return (
        <section id="features" className="space-y-16 py-20 md:py-32">
            <div className="space-y-4 text-center">
                <Badge variant="outline" className="mx-auto">{translations.features}</Badge>
                <h2 className="text-4xl md:text-5xl font-bold">
                    {translations.featuresTitle}
                </h2>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                    {translations.featuresDescription}
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pt-12">
                {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                        <div key={index} className="space-y-4">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
                                <Icon className="w-6 h-6 text-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">
                                {translations[feature.title as keyof typeof translations]}
                            </h3>
                            <p className="text-muted-foreground">
                                {translations[feature.description as keyof typeof translations]}
                            </p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
