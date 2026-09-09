"use client";

import { useRef, useEffect, useState } from "react";
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
import { loginSchema, type LoginFormData } from "@/schemas/login.schema";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks";
import { setAccessToken, setRole } from "@/lib/authContext";
import { setTenantContext } from "@/lib/tenantContext";
import { Role } from "@/lib/rbacEngine";
import { t } from "@/i18n";
import { hasTwoFactorEnabled } from "@/modules/auth/twoFactor.storage";
import { TwoFactorVerifyDialog } from "@/modules/auth/components/TwoFactorVerifyDialog";

export function LoginForm() {
    const router = useRouter();
    const { toast } = useToast();
    const formMountTime = useRef<number>(0);
    const [show2FADialog, setShow2FADialog] = useState(false);
    const [pendingEmail, setPendingEmail] = useState("");

    useEffect(() => {
        formMountTime.current = Date.now();
    }, []);

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
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
        const timeElapsed = Date.now() - formMountTime.current;
        if (timeElapsed < 1500) {
            // Too fast, likely a bot
            return;
        }

        try {
            // Check if user has 2FA enabled
            if (hasTwoFactorEnabled(data.email)) {
                // Store pending data and show 2FA dialog
                setPendingEmail(data.email);
                setShow2FADialog(true);
                return;
            }

            // Complete login without 2FA
            completeLogin();
            form.reset();
        } catch (error) {
            // Generic error message to prevent user enumeration
            toast({
                title: "Error",
                description: t().auth.invalidCredentials,
                variant: "destructive",
            });
        }
    };

    const completeLogin = () => {
        setAccessToken(globalThis.crypto.randomUUID());
        setRole(Role.TENANT_ADMIN);
        setTenantContext(
            globalThis.crypto.randomUUID(),
            `tenant-${globalThis.crypto.randomUUID()}`,
        );

        toast({
            title: "Inicio exitoso",
            description: "Bienvenido de vuelta",
        });

        router.push("/system/dashboard");
    };

    const handle2FAVerified = () => {
        setShow2FADialog(false);
        completeLogin();
        form.reset();
    };

    const handle2FACancel = () => {
        setShow2FADialog(false);
        setPendingEmail("");
        toast({
            title: "Inicio de sesión cancelado",
            description: "Se requiere verificación 2FA para continuar",
            variant: "destructive",
        });
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
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel>Password</FormLabel>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {t().auth.forgotPassword}
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
                            {t().auth.loginButton}...
                        </>
                    ) : (
                        t().auth.loginButton
                    )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    {t().auth.noAccount}{" "}
                    <Link href="/signup" className="font-semibold text-foreground hover:underline">
                        {t().auth.signupLink}
                    </Link>
                </p>
            </form>

            <TwoFactorVerifyDialog
                open={show2FADialog}
                onOpenChange={setShow2FADialog}
                email={pendingEmail}
                onVerified={handle2FAVerified}
                onCancel={handle2FACancel}
            />
        </Form>
    );
}
