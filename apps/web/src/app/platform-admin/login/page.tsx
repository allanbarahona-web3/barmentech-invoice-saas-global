"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks";
import { useAuth } from "@/lib/authContext";

const schema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export default function PlatformLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { superAdminLogin } = useAuth();
    const mountTime = useRef(Date.now());
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (values: FormValues) => {
        const elapsed = Date.now() - mountTime.current;
        if (elapsed < 1000) return;

        setSubmitting(true);
        try {
            const user = await superAdminLogin(values);

            if (user.role !== "SUPER_ADMIN" || user.tenantId !== null) {
                throw new Error("Invalid platform authentication response");
            }

            toast({
                title: "Acceso concedido",
                description: "Bienvenido al módulo de Super Admin",
            });

            router.push("/platform-admin/dashboard");
        } catch {
            toast({
                title: "Error",
                description: "Credenciales inválidas para plataforma",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
            <Card className="w-full max-w-md p-8 space-y-6 shadow-xl">
                <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                        <Shield className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold">Super Admin</h1>
                    <p className="text-sm text-muted-foreground">
                        Acceso al panel de plataforma
                    </p>
                </div>

                <Form {...form}>
                    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="you@example.com" {...field} />
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
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button className="w-full" type="submit" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                "Entrar a Plataforma"
                            )}
                        </Button>
                    </form>
                </Form>
            </Card>
        </div>
    );
}
