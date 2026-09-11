import { z } from "zod";

export type SignupValidationMessages = {
    fullNameRequired: string;
    fullNameMin: string;
    emailRequired: string;
    emailInvalid: string;
    companyNameRequired: string;
    companyNameMin: string;
    passwordRequired: string;
    passwordMin: string;
};

export function createSignupSchema(messages: SignupValidationMessages) {
    return z.object({
    fullName: z
        .string()
        .min(1, messages.fullNameRequired)
        .min(2, messages.fullNameMin),
    email: z
        .string()
        .min(1, messages.emailRequired)
        .email(messages.emailInvalid),
    companyName: z
        .string()
        .min(1, messages.companyNameRequired)
        .min(2, messages.companyNameMin),
    password: z
        .string()
        .min(1, messages.passwordRequired)
        .min(8, messages.passwordMin),
    website: z.string().optional(),
    });
}

export type SignupFormData = z.infer<ReturnType<typeof createSignupSchema>>;
