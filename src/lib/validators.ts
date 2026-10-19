import { z } from "zod";

export const nicheCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(2000).optional(),
  monetizationScore: z.number().int().min(0).max(100).optional(),
  salesLinkUrl: z.string().trim().url().optional().or(z.literal("")),
});

export const nicheUpdateSchema = nicheCreateSchema.partial();
