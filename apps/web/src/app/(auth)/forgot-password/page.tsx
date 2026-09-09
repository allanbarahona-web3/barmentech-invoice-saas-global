import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthCard } from "@/components/auth/AuthCard";

export default function ForgotPasswordPage() {
    return (
        <AuthCard
            title="Recuperar contraseña"
            description="Te enviaremos un enlace para restablecer tu contraseña"
        >
            <ForgotPasswordForm />
        </AuthCard>
    );
}
