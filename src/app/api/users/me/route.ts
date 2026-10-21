import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { updateProfileSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);
  if (!session.user?.id) return fail("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input", 422);

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return fail("User not found", 404);

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!valid) return fail("Current password is incorrect", 401);

  const data: { email?: string; password?: string } = {};

  if (parsed.data.email) {
    const email = parsed.data.email.toLowerCase();
    if (email !== user.email.toLowerCase()) {
      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken) return fail("Email is already in use", 409);
      data.email = email;
    }
  }

  if (parsed.data.newPassword) {
    data.password = await bcrypt.hash(parsed.data.newPassword, 10);
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data });

  return ok({
    id: updated.id,
    email: updated.email,
    role: updated.role,
    googleLinked: updated.googleLinked,
  });
}
