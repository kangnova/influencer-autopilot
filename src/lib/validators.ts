import { z } from "zod";

export const nicheCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(2000).optional(),
  monetizationScore: z.number().int().min(0).max(100).optional(),
  salesLinkUrl: z.string().trim().url().optional().or(z.literal("")),
});

export const nicheUpdateSchema = nicheCreateSchema.partial();

export const personaCreateSchema = z.object({
  nicheId: z.string().min(1, "Niche is required"),
  name: z.string().trim().min(1, "Name is required").max(200),
  masterPrompt: z.string().trim().max(10000).optional(),
  avatarImageUrl: z.string().trim().url().optional().or(z.literal("")),
  identity: z.string().trim().max(4000).optional(),
});

export const personaUpdateSchema = personaCreateSchema.partial();
