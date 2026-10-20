import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { socialAccountCreateSchema } from "@/lib/validators";
import { encrypt } from "@/lib/encryption";
import { getSocialProvider } from "@/lib/social-provider";

/** Strip the encrypted token — it must never reach the client. */
function safe(account: { accessToken: string; [k: string]: unknown }) {
  const copy = { ...account } as Record<string, unknown>;
  delete copy.accessToken;
  return { ...copy, connected: true };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const accounts = await prisma.socialAccount.findMany({
    orderBy: { createdAt: "desc" },
  });
  return ok(accounts.map(safe));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = socialAccountCreateSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input", 422);

  const provider = getSocialProvider();
  const accessToken = parsed.data.accessToken || "";
  if (provider.name !== "manual" && !accessToken) {
    return fail("Access token is required to connect Instagram", 422);
  }

  let handle: string;
  let accountType: string;

  if (provider.name === "manual") {
    // Manual mode: trust the typed handle, no API verification (no account risk).
    handle = parsed.data.handle;
    accountType = parsed.data.accountType;
  } else {
    // Real mode: verify the token against the Graph API before storing anything.
    try {
      const verified = await provider.connect(accessToken);
      handle = verified.handle;
      accountType = verified.accountType;
    } catch (e) {
      return fail(
        e instanceof Error ? e.message : "Failed to verify Instagram token",
        400
      );
    }
  }

  const account = await prisma.socialAccount.create({
    data: {
      handle,
      accountType,
      accessToken: encrypt(accessToken),
      status: "READY",
    },
  });

  return ok(safe(account), 201);
}
