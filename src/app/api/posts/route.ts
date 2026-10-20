import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { postCreateSchema } from "@/lib/validators";

/** Strip the encrypted token from a nested social account. */
function safe(account: { accessToken: string; [k: string]: unknown }) {
  const copy = { ...account } as Record<string, unknown>;
  delete copy.accessToken;
  return copy;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      socialAccount: true,
      contentItem: {
        include: {
          mediaAsset: true,
          plan: { include: { niche: true } },
        },
      },
    },
  });

  return ok(posts.map((p) => ({ ...p, socialAccount: safe(p.socialAccount) })));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = postCreateSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input", 422);

  const { contentItemId, socialAccountId, caption, scheduledAt } = parsed.data;

  const account = await prisma.socialAccount.findUnique({
    where: { id: socialAccountId },
  });
  if (!account) return fail("Social account not found", 404);

  let itemId: string | null = null;
  if (contentItemId) {
    const item = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
    });
    if (!item) return fail("Content item not found", 404);
    itemId = contentItemId;
  }

  const when = scheduledAt ? new Date(scheduledAt) : null;
  const hasSchedule = Boolean(when && !Number.isNaN(when.getTime()));

  const post = await prisma.post.create({
    data: {
      contentItemId: itemId,
      socialAccountId,
      caption: caption || null,
      scheduledAt: hasSchedule ? when : null,
      status: hasSchedule ? "SCHEDULED" : "DRAFT",
    },
  });

  return ok(post, 201);
}
