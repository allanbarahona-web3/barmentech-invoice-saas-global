"use client";

import { SignupForm } from "@/components/auth/SignupForm";
import { AuthCard } from "@/components/auth/AuthCard";
import { useTranslations } from "@/i18n";

export default function SignupPage() {
    const { messages } = useTranslations();
    return (
        <AuthCard
            title={messages.auth.signupTitle}
            subtitle={messages.auth.signupSubtitle}
        >
            <SignupForm />
        </AuthCard>
    );
}
