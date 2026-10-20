import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const { id } = await params;
  try {
    await prisma.socialAccount.delete({ where: { id } });
  } catch {
    return fail(
      "Cannot delete: this account still has posts. Delete its posts first.",
      409
    );
  }
  return ok({ deleted: true });
}
