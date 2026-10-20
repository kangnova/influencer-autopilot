import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { unlink } from "fs/promises";
import path from "path";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const { id } = await params;
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return fail("Not found", 404);

  if (asset.url.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", asset.url);
    await unlink(filePath).catch(() => {});
  }

  await prisma.mediaAsset.delete({ where: { id } });
  return ok({ deleted: true });
}
