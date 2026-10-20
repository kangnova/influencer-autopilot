import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { metricCreateSchema } from "@/lib/validators";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const metrics = await prisma.metric.findMany({
    orderBy: { date: "desc" },
    include: { post: { include: { contentItem: true } } },
  });
  return ok(metrics);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = metricCreateSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input", 422);

  const post = await prisma.post.findUnique({ where: { id: parsed.data.postId } });
  if (!post) return fail("Post not found", 404);

  const metric = await prisma.metric.create({
    data: {
      postId: parsed.data.postId,
      impressions: parsed.data.impressions ?? 0,
      reach: parsed.data.reach ?? 0,
      likes: parsed.data.likes ?? 0,
      comments: parsed.data.comments ?? 0,
      shares: parsed.data.shares ?? 0,
      clicks: parsed.data.clicks ?? 0,
      sales: parsed.data.sales ?? 0,
    },
  });

  return ok(metric, 201);
}
