"use client";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthCard } from "@/components/auth/AuthCard";
import { useTranslations } from "@/i18n";

export default function ForgotPasswordPage() {
    const { messages } = useTranslations();
    return (
        <AuthCard
            title={messages.auth.forgotPasswordTitle}
            subtitle={messages.auth.forgotPasswordSubtitle}
        >
            <ForgotPasswordForm />
        </AuthCard>
    );
}
