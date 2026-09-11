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
import { createLoginSchema, type LoginFormData } from "@/schemas/login.schema";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks";
import { useAuth } from "@/lib/authContext";
import { useTranslations } from "@/i18n";

export function LoginForm() {
    const router = useRouter();
    const { toast } = useToast();
    const { login } = useAuth();
    const { messages } = useTranslations();
    const [isHumanReady, setIsHumanReady] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setIsHumanReady(true);
        }, 1500);

        return () => window.clearTimeout(timer);
    }, []);

    const form = useForm<LoginFormData>({
        resolver: zodResolver(createLoginSchema(messages.auth)),
        defaultValues: {
            email: "",
            password: "",
            website: "",
        },
    });

    const onSubmit = async (data: LoginFormData) => {
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

        try {
            await login({ email: data.email, password: data.password });
            router.push("/system/dashboard");
            form.reset();
        } catch {
            // Generic error message to prevent user enumeration
            toast({
                title: messages.auth.error,
                description: messages.auth.invalidCredentials,
                variant: "destructive",
            });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel>{messages.auth.password}</FormLabel>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {messages.auth.forgotPassword}
                                </Link>
                            </div>
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
                            {messages.auth.loginButton}...
                        </>
                    ) : (
                        messages.auth.loginButton
                    )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    {messages.auth.noAccount}{" "}
                    <Link href="/signup" className="font-semibold text-foreground hover:underline">
                        {messages.auth.signupLink}
                    </Link>
                </p>
            </form>
        </Form>
    );
}
