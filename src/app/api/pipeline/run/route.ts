import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";

const TYPES = [
  "NICHE_RESEARCH",
  "PERSONA_GENERATE",
  "COURSE_SCRIPTS",
  "CONTENT_PLAN",
] as const;

const runSchema = z.object({
  type: z.enum(TYPES),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = runSchema.safeParse(body);
  if (!parsed.success) {
    return fail(`Invalid input: ${parsed.error.issues[0]?.message ?? "check payload"}`, 422);
  }

  const job = await prisma.job.create({
    data: {
      type: parsed.data.type,
      payload: parsed.data.payload as unknown as Prisma.InputJsonValue,
    },
  });

  return ok(job, 201);
}
