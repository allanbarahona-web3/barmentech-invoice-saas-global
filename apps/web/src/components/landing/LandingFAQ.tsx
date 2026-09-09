"use client";

import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { t } from "@/i18n";

const faqs = [
    {
        question: "faq1Question",
        answer: "faq1Answer",
    },
    {
        question: "faq2Question",
        answer: "faq2Answer",
    },
    {
        question: "faq3Question",
        answer: "faq3Answer",
    },
    {
        question: "faq4Question",
        answer: "faq4Answer",
    },
    {
        question: "faq5Question",
        answer: "faq5Answer",
    },
];

export function LandingFAQ() {
    const translations = t().landing;
    
    return (
        <section className="space-y-12 py-20 md:py-32">
            <div className="space-y-4 text-center">
                <Badge variant="outline" className="mx-auto">{translations.faq}</Badge>
                <h2 className="text-4xl md:text-5xl font-bold">
                    {translations.faqTitle}
                </h2>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                    {translations.faqDescription}
                </p>
            </div>

            <div className="mx-auto max-w-3xl pt-8">
                <Accordion type="single" collapsible className="w-full space-y-4">
                    {faqs.map((faq, index) => (
                        <AccordionItem
                            key={index}
                            value={`item-${index}`}
                            className="border rounded-lg px-6"
                        >
                            <AccordionTrigger className="text-left font-semibold hover:no-underline">
                                {translations[faq.question as keyof typeof translations]}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                {translations[faq.answer as keyof typeof translations]}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
