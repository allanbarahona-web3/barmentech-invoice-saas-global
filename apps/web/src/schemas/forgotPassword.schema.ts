import { z } from "zod";

export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, "Email es requerido")
        .email("Por favor ingresa un email válido"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
