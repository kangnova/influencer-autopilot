import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { personaUpdateSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const { id } = await params;
  const persona = await prisma.persona.findUnique({
    where: { id },
    include: { niche: { select: { id: true, name: true } } },
  });
  if (!persona) return fail("Not found", 404);
  return ok(persona);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = personaUpdateSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input", 422);

  const d = parsed.data;
  const persona = await prisma.persona.update({
    where: { id },
    data: {
      ...(d.nicheId !== undefined && { nicheId: d.nicheId }),
      ...(d.name !== undefined && { name: d.name }),
      ...(d.masterPrompt !== undefined && { masterPrompt: d.masterPrompt }),
      ...(d.avatarImageUrl !== undefined && {
        avatarImageUrl: d.avatarImageUrl || null,
      }),
      ...(d.identity !== undefined && { identity: d.identity || null }),
    },
  });
  return ok(persona);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const { id } = await params;
  await prisma.persona.delete({ where: { id } });
  return ok({ deleted: true });
}
