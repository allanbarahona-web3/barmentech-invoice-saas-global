import { z } from "zod";

export const productSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().min(0),
  type: z.enum(["product", "service"]),
  status: z.enum(["active", "inactive"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const productInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().min(0),
  type: z.enum(["product", "service"]),
  status: z.enum(["active", "inactive"]),
});

export type Product = z.infer<typeof productSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
