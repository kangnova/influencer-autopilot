import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api";

/**
 * Public lookup used by the login page to auto-detect whether an email is
 * linked to Google (so it can nudge "Continue with Google"). No auth — the
 * login page is unauthenticated. Returns only a boolean, never the user row.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) return ok({ googleLinked: false });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { googleLinked: true },
  });

  return ok({ googleLinked: Boolean(user?.googleLinked) });
}
