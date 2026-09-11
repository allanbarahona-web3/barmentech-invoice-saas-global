"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { AuthCard } from "@/components/auth/AuthCard";
import { useTranslations } from "@/i18n";

export default function LoginPage() {
    const { messages } = useTranslations();
    return (
        <AuthCard
            title={messages.auth.loginTitle}
            subtitle={messages.auth.loginSubtitle}
        >
            <LoginForm />
        </AuthCard>
    );
}
