import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { userCreateSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";

/** User fields safe to expose (never the password hash). */
function safe(user: {
  id: string;
  email: string;
  role: string;
  googleLinked: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    googleLinked: user.googleLinked,
    createdAt: user.createdAt,
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return ok(users.map(safe));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = userCreateSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input", 422);

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return fail("Email is already registered", 409);

  const hashed = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, role: "OPERATOR" },
  });

  return ok(safe(user), 201);
}
