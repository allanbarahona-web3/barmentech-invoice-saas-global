import { z } from "zod";

export const signupSchema = z.object({
    fullName: z
        .string()
        .min(1, "Full name is required")
        .min(2, "Full name must be at least 2 characters"),
    email: z
        .string()
        .min(1, "Email is required")
        .email("Please enter a valid email address"),
    companyName: z
        .string()
        .min(1, "Company name is required")
        .min(2, "Company name must be at least 2 characters"),
    password: z
        .string()
        .min(1, "Password is required")
        .min(8, "Password must be at least 8 characters"),
    website: z.string().optional(),
});

export type SignupFormData = z.infer<typeof signupSchema>;
