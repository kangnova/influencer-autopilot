import { z } from "zod";

export const nicheCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(2000).optional(),
  monetizationScore: z.number().int().min(0).max(100).optional(),
  monetizationType: z.enum(["OWN_PRODUCT", "AFFILIATE"]).optional(),
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

export const socialAccountCreateSchema = z.object({
  handle: z.string().trim().min(1, "Handle is required").max(100),
  accessToken: z.string().trim().optional().or(z.literal("")),
  accountType: z.enum(["BUSINESS", "CREATOR"]).default("BUSINESS"),
});

export const postCreateSchema = z.object({
  contentItemId: z.string().trim().min(1).optional().or(z.literal("")),
  socialAccountId: z.string().trim().min(1, "Social account is required"),
  caption: z.string().trim().max(5000).optional(),
  format: z.enum(["VIDEO", "CAROUSEL"]).default("VIDEO"),
  carouselImages: z.array(z.string().trim().min(1)).max(10).optional(),
  scheduledAt: z.string().trim().optional().or(z.literal("")),
});

export const postUpdateSchema = postCreateSchema.partial();

export const metricCreateSchema = z.object({
  postId: z.string().trim().min(1, "Post is required"),
  impressions: z.number().int().min(0).optional(),
  reach: z.number().int().min(0).optional(),
  likes: z.number().int().min(0).optional(),
  comments: z.number().int().min(0).optional(),
  shares: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
  sales: z.number().int().min(0).optional(),
});

export const metricUpdateSchema = metricCreateSchema.partial();

export const updateProfileSchema = z
  .object({
    email: z.string().trim().email("Invalid email").max(200).optional(),
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(200)
      .optional(),
  })
  .refine((d) => d.email || d.newPassword, {
    message: "Nothing to update",
  });

export const userCreateSchema = z.object({
  email: z.string().trim().email("Invalid email").max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});
