import { z } from "zod";

export function createForgotPasswordSchema(messages: { emailRequired: string; emailInvalid: string }) {
    return z.object({
    email: z
        .string()
        .min(1, messages.emailRequired)
        .email(messages.emailInvalid),
    });
}

export type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
