"use client";

import { useRef, useEffect } from "react";
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
import { signupSchema, type SignupFormData } from "@/schemas/signup.schema";
import { useToast } from "@/hooks";
import { setAccessToken, setRole } from "@/lib/authContext";
import { setTenantContext } from "@/lib/tenantContext";
import { useRouter } from "next/navigation";
import { Role } from "@/lib/rbacEngine";
import { t } from "@/i18n";

export function SignupForm() {
    const { toast } = useToast();
    const router = useRouter();
    const formMountTime = useRef<number>(0);

    useEffect(() => {
        formMountTime.current = Date.now();
    }, []);

    const form = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
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
        const timeElapsed = Date.now() - formMountTime.current;
        if (timeElapsed < 1500) {
            // Too fast, likely a bot
            return;
        }

        try {
            // Simulated backend call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Simulate token and tenant context generation
            const mockToken = globalThis.crypto.randomUUID();
            setAccessToken(mockToken);
            
            // New signup users get TENANT_ADMIN role by default
            setRole(Role.TENANT_ADMIN);
            
            // Set tenant context for new user
            setTenantContext(
                globalThis.crypto.randomUUID(),
                `tenant-${globalThis.crypto.randomUUID()}`,
            );
            
            toast({
                title: "Cuenta creada",
                description: "Bienvenido a la plataforma",
            });
            
            form.reset();
            
            // Redirect to system dashboard
            router.push("/system/dashboard");
        } catch (error) {
            // Generic error message to prevent user enumeration
            toast({
                title: "Error",
                description: t().auth.createAccountError,
                variant: "destructive",
            });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="John Doe"
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
                    name="companyName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Acme Inc"
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
                            <FormLabel>Password</FormLabel>
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
                            {t().auth.signupButton}...
                        </>
                    ) : (
                        t().auth.signupButton
                    )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    {t().auth.haveAccount}{" "}
                    <Link href="/login" className="font-semibold text-foreground hover:underline">
                        {t().auth.loginLink}
                    </Link>
                </p>
            </form>
        </Form>
    );
}
