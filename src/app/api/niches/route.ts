import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { nicheCreateSchema } from "@/lib/validators";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const niches = await prisma.niche.findMany({ orderBy: { createdAt: "desc" } });
  return ok(niches);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = nicheCreateSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input", 422);

  const niche = await prisma.niche.create({ data: parsed.data });
  return ok(niche, 201);
}
