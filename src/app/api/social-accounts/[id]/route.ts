import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { encrypt } from "@/lib/encryption";
import { getSocialProvider } from "@/lib/social-provider";

type Params = { params: Promise<{ id: string }> };

/** Strip the encrypted token — it must never reach the client. */
function safe(account: { accessToken: string; [k: string]: unknown }) {
  const copy = { ...account } as Record<string, unknown>;
  delete copy.accessToken;
  return copy;
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const accessToken =
    typeof body?.accessToken === "string" ? body.accessToken.trim() : "";
  if (!accessToken) return fail("Access token is required", 422);

  const account = await prisma.socialAccount.findUnique({ where: { id } });
  if (!account) return fail("Not found", 404);

  const provider = getSocialProvider();
  if (provider.name === "manual") {
    return fail("Manual mode does not store a token", 400);
  }

  // Verify the new token resolves the Instagram account before overwriting.
  let handle: string;
  let accountType: string;
  try {
    const verified = await provider.connect(accessToken);
    handle = verified.handle;
    accountType = verified.accountType;
  } catch (e) {
    return fail(
      e instanceof Error ? e.message : "Failed to verify the new token",
      400
    );
  }

  const updated = await prisma.socialAccount.update({
    where: { id },
    data: {
      accessToken: encrypt(accessToken),
      handle,
      accountType,
      status: "READY",
    },
  });

  return ok(safe(updated));
}

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
