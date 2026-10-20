import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { personaCreateSchema } from "@/lib/validators";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const personas = await prisma.persona.findMany({
    orderBy: { createdAt: "desc" },
    include: { niche: { select: { id: true, name: true } } },
  });
  return ok(personas);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = personaCreateSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input", 422);

  const persona = await prisma.persona.create({
    data: {
      nicheId: parsed.data.nicheId,
      name: parsed.data.name,
      masterPrompt: parsed.data.masterPrompt ?? "",
      avatarImageUrl: parsed.data.avatarImageUrl || null,
      identity: parsed.data.identity || null,
    },
  });
  return ok(persona, 201);
}
