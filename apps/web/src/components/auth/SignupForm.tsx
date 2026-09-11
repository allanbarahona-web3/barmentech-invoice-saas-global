"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { createSignupSchema, type SignupFormData } from "@/schemas/signup.schema";
import { useToast } from "@/hooks";
import { useTranslations } from "@/i18n";

export function SignupForm() {
    const { toast } = useToast();
    const { messages } = useTranslations();
    const [isHumanReady, setIsHumanReady] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setIsHumanReady(true);
        }, 1500);

        return () => window.clearTimeout(timer);
    }, []);

    const form = useForm<SignupFormData>({
        resolver: zodResolver(createSignupSchema(messages.auth)),
        defaultValues: {
            fullName: "",
            email: "",
            companyName: "",
            password: "",
            website: "",
        },
    });

    const onSubmit = async (data: SignupFormData) => {
        // Anti-bot: honeypot check
        if (data.website) {
            // Bot detected, abort silently
            return;
        }

        // Anti-bot: human delay check
        if (!isHumanReady) {
            // Too fast, likely a bot
            return;
        }

        toast({
            title: messages.auth.error,
            description: messages.auth.createAccountError,
            variant: "destructive",
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{messages.auth.fullName}</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={messages.auth.fullNamePlaceholder}
                                    disabled={form.formState.isSubmitting}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{messages.auth.email}</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={messages.auth.emailPlaceholder}
                                    type="email"
                                    disabled={form.formState.isSubmitting}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{messages.auth.companyName}</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={messages.auth.companyNamePlaceholder}
                                    disabled={form.formState.isSubmitting}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{messages.auth.password}</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="••••••••"
                                    type="password"
                                    disabled={form.formState.isSubmitting}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Honeypot field - hidden from users */}
                <input
                    type="text"
                    {...form.register("website")}
                    style={{ display: "none" }}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                />

                <Button
                    type="submit"
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                >
                    {form.formState.isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {messages.auth.signupButton}...
                        </>
                    ) : (
                        messages.auth.signupButton
                    )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    {messages.auth.haveAccount}{" "}
                    <Link href="/login" className="font-semibold text-foreground hover:underline">
                        {messages.auth.loginLink}
                    </Link>
                </p>
            </form>
        </Form>
    );
}
