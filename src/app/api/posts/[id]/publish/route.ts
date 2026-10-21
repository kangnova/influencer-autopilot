import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { decrypt } from "@/lib/encryption";
import { getSocialProvider } from "@/lib/social-provider";

type Params = { params: Promise<{ id: string }> };

/** Resolve a stored /uploads/... path to a public URL the Graph API can fetch. */
function publicUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const base =
    process.env.PUBLIC_BASE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3007";
  return `${base.replace(/\/$/, "")}${path}`;
}

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { mode?: string } | null;
  const mode = body?.mode === "manual" ? "manual" : "auto";

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      socialAccount: true,
      contentItem: {
        include: { mediaAsset: true, plan: { include: { niche: true } } },
      },
    },
  });
  if (!post) return fail("Not found", 404);
  if (!post.approved) return fail("Post is not approved yet", 409);
  if (post.status === "PUBLISHED") return fail("Already published", 409);

  // Manual mark: the operator already posted it themselves (no API, no risk).
  if (mode === "manual") {
    const updated = await prisma.post.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    return ok(updated);
  }

  const isCarousel = post.format === "CAROUSEL";
  const carouselImages = Array.isArray(post.carouselImages)
    ? (post.carouselImages as string[])
    : [];

  if (isCarousel) {
    if (carouselImages.length < 2) {
      return fail("A carousel post needs at least 2 slide image URLs", 422);
    }
  } else if (!post.contentItem?.mediaAsset) {
    return fail("This post's content item has no media attached", 422);
  }

  const provider = getSocialProvider();
  try {
    const token = decrypt(post.socialAccount.accessToken);
    const { externalPostId } = await provider.publish(token, {
      caption: post.caption ?? post.contentItem?.hook ?? "",
      mediaUrl: publicUrl(post.contentItem?.mediaAsset?.url ?? ""),
      mediaKind: post.contentItem?.mediaAsset?.kind ?? "IMAGE",
      format: post.format,
      carouselImages: isCarousel ? carouselImages.map(publicUrl) : undefined,
    });

    const updated = await prisma.post.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date(), externalPostId },
    });
    return ok(updated);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Publish failed", 502);
  }
}
