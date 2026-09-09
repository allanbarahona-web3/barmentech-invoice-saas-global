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
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/schemas/forgotPassword.schema";
import { useToast } from "@/hooks";

export function ForgotPasswordForm() {
    const { toast } = useToast();

    const form = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
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
                title: "Email enviado",
                description: "Si la cuenta existe, recibirás un correo con instrucciones para restablecer tu contraseña.",
            });

            form.reset();
        } catch (error) {
            // Same generic message even on error
            toast({
                title: "Email enviado",
                description: "Si la cuenta existe, recibirás un correo con instrucciones para restablecer tu contraseña.",
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
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="you@example.com"
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
                            Enviando...
                        </>
                    ) : (
                        "Enviar instrucciones"
                    )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    ¿Recordaste tu contraseña?{" "}
                    <Link href="/login" className="font-semibold text-foreground hover:underline">
                        Iniciar sesión
                    </Link>
                </p>
            </form>
        </Form>
    );
}
