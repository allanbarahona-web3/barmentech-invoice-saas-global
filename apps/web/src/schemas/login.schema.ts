import { z } from "zod";

export type LoginValidationMessages = {
    emailRequired: string;
    emailInvalid: string;
    passwordRequired: string;
    passwordMin: string;
};

export function createLoginSchema(messages: LoginValidationMessages) {
    return z.object({
    email: z
        .string()
        .min(1, messages.emailRequired)
        .email(messages.emailInvalid),
    password: z
        .string()
        .min(1, messages.passwordRequired)
        .min(8, messages.passwordMin),
    website: z.string().optional(),
    });
}

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;
