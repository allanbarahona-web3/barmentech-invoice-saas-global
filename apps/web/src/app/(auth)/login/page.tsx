"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { AuthCard } from "@/components/auth/AuthCard";

export default function LoginPage() {
    return (
        <AuthCard
            title="Log In"
            subtitle="Welcome back to Barmentech Invoice"
        >
            <LoginForm />
        </AuthCard>
    );
}
