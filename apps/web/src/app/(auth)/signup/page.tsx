"use client";

import { SignupForm } from "@/components/auth/SignupForm";
import { AuthCard } from "@/components/auth/AuthCard";

export default function SignupPage() {
    return (
        <AuthCard
            title="Create Account"
            subtitle="Start your free trial today"
        >
            <SignupForm />
        </AuthCard>
    );
}
