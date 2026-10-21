import { prisma } from "../src/lib/prisma";
import { decrypt } from "../src/lib/encryption";
import { getSocialProvider } from "../src/lib/social-provider";

// tsx does not auto-load .env. Prisma loads DATABASE_URL itself, but the social
// provider needs PUBLIC_BASE_URL / NEXTAUTH_URL and SOCIAL_PROVIDER.
try {
  process.loadEnvFile(".env");
} catch {
  // .env missing or loadEnvFile unavailable — fall back to the shell env.
}

const POLL_MS = Number(process.env.SCHEDULER_POLL_MS ?? 30_000);
// Safety floor between auto-publishes, in hours (default 20 ≈ once a day).
const MIN_HOURS = Number(process.env.MIN_HOURS_BETWEEN_POSTS ?? 20);

/** Resolve a stored /uploads/... path to a public URL the Graph API can fetch. */
function publicUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const base =
    process.env.PUBLIC_BASE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3007";
  return `${base.replace(/\/$/, "")}${path}`;
}

interface DuePost {
  id: string;
  caption: string | null;
  format: string;
  carouselImages: unknown;
  socialAccount: { accessToken: string };
  contentItem: {
    hook: string | null;
    mediaAsset: { url: string; kind: string } | null;
  } | null;
}

/**
 * Atomically claim one due post: SCHEDULED -> READY (a transient
 * "publishing" marker). Mirrors the Job claim in scripts/worker.ts.
 */
async function claimOne(): Promise<DuePost | null> {
  const claimed = await prisma.$queryRaw<{ id: string }[]>`
    UPDATE "Post"
    SET status = 'READY'
    WHERE id = (
      SELECT id FROM "Post"
      WHERE status = 'SCHEDULED'
        AND approved = true
        AND "scheduledAt" <= now()
      ORDER BY "scheduledAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id
  `;
  const id = claimed[0]?.id;
  if (!id) return null;
  return (await prisma.post.findUnique({
    where: { id },
    include: {
      socialAccount: true,
      contentItem: { include: { mediaAsset: true } },
    },
  })) as DuePost | null;
}

async function publishDue(post: DuePost): Promise<string> {
  const provider = getSocialProvider();
  const token = decrypt(post.socialAccount.accessToken);
  const isCarousel = post.format === "CAROUSEL";
  const carouselImages = Array.isArray(post.carouselImages)
    ? (post.carouselImages as string[])
    : [];
  const { externalPostId } = await provider.publish(token, {
    caption: post.caption ?? post.contentItem?.hook ?? "",
    mediaUrl: publicUrl(post.contentItem?.mediaAsset?.url ?? ""),
    mediaKind: (post.contentItem?.mediaAsset?.kind ?? "IMAGE") as
      | "IMAGE"
      | "VIDEO",
    format: post.format as "VIDEO" | "CAROUSEL",
    carouselImages: isCarousel ? carouselImages.map(publicUrl) : undefined,
  });
  return externalPostId;
}

async function tick(): Promise<boolean> {
  const provider = getSocialProvider();
  if (provider.name !== "instagram") {
    // Manual mode: auto-publish is intentionally disabled (no API, no ban risk).
    return false;
  }

  // Rate-limit floor: skip while the most recent publish is still fresh.
  const last = await prisma.post.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });
  if (
    last?.publishedAt &&
    Date.now() - last.publishedAt.getTime() < MIN_HOURS * 3_600_000
  ) {
    return false;
  }

  const post = await claimOne();
  if (!post) return false;

  try {
    const externalPostId = await publishDue(post);
    await prisma.post.update({
      where: { id: post.id },
      data: { status: "PUBLISHED", publishedAt: new Date(), externalPostId },
    });
    console.log(`[scheduler] ${post.id} PUBLISHED (IG ${externalPostId})`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.post.update({
      where: { id: post.id },
      data: { status: "FAILED" },
    });
    console.error(`[scheduler] ${post.id} FAILED: ${msg}`);
  }
  return true;
}

async function main() {
  const provider = getSocialProvider();
  console.log(
    `[scheduler] polling every ${POLL_MS}ms, provider=${provider.name}, ` +
      `min gap=${MIN_HOURS}h`
  );
  for (;;) {
    let didWork = false;
    try {
      didWork = await tick();
    } catch (e) {
      console.error("[scheduler] tick error:", e);
    }
    if (!didWork) await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

main();
