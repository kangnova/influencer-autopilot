import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { decrypt } from "@/lib/encryption";
import { getSocialProvider } from "@/lib/social-provider";

type Params = { params: Promise<{ id: string }> };

/**
 * Pull insights for a published post from the Instagram connector and store
 * them as a Metric row. Only works with SOCIAL_PROVIDER=instagram and a post
 * that was auto-published (has an externalPostId).
 */
export async function POST(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { socialAccount: true },
  });
  if (!post) return fail("Not found", 404);
  if (post.status !== "PUBLISHED") return fail("Post is not published", 409);
  if (!post.externalPostId) {
    return fail("Post has no Instagram media id (not auto-published)", 422);
  }

  const provider = getSocialProvider();
  try {
    const token = decrypt(post.socialAccount.accessToken);
    const insights = await provider.insights(token, post.externalPostId);
    const metric = await prisma.metric.create({
      data: {
        postId: post.id,
        impressions: insights.impressions,
        reach: insights.reach,
        likes: insights.likes,
        comments: insights.comments,
        shares: insights.shares,
      },
    });
    return ok(metric, 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to pull insights", 502);
  }
}
