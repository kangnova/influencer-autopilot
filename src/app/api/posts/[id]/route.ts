import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { socialAccount: true, contentItem: true },
  });
  if (!post) return fail("Not found", 404);
  return ok(post);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const { id } = await params;
  await prisma.post.delete({ where: { id } });
  return ok({ deleted: true });
}
