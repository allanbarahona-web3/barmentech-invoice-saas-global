"use client";

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
import { createForgotPasswordSchema, type ForgotPasswordFormData } from "@/schemas/forgotPassword.schema";
import { useToast } from "@/hooks";
import { useTranslations } from "@/i18n";

export function ForgotPasswordForm() {
    const { toast } = useToast();
    const { messages } = useTranslations();

    const form = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(createForgotPasswordSchema(messages.auth)),
        defaultValues: {
            email: "",
        },
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            // Simulated backend call
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Generic success message - don't reveal if account exists
            toast({
                title: messages.auth.passwordResetSent,
                description: messages.auth.passwordResetSentDescription,
            });

            form.reset();
        } catch (error) {
            // Same generic message even on error
            toast({
                title: messages.auth.passwordResetSent,
                description: messages.auth.passwordResetSentDescription,
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

                <Button
                    type="submit"
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                >
                    {form.formState.isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {messages.auth.sending}
                        </>
                    ) : (
                        messages.auth.sendInstructions
                    )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    {messages.auth.rememberedPassword}{" "}
                    <Link href="/login" className="font-semibold text-foreground hover:underline">
                        {messages.auth.loginLink}
                    </Link>
                </p>
            </form>
        </Form>
    );
}
