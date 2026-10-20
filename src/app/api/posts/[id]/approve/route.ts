import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return fail("Not found", 404);

  const updated = await prisma.post.update({
    where: { id },
    data: { approved: true },
  });
  return ok(updated);
}
