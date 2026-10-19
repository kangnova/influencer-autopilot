import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { nicheUpdateSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const { id } = await params;
  const niche = await prisma.niche.findUnique({ where: { id } });
  if (!niche) return fail("Not found", 404);
  return ok(niche);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = nicheUpdateSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input", 422);

  const niche = await prisma.niche.update({ where: { id }, data: parsed.data });
  return ok(niche);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const { id } = await params;
  await prisma.niche.delete({ where: { id } });
  return ok({ deleted: true });
}
