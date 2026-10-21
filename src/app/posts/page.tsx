import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { PostForm } from "@/components/post-form";
import { PostActions } from "@/components/post-actions";
import { DeleteButton } from "@/components/delete-button";
import { PullInsightsButton } from "@/components/pull-insights-button";
import { LogoutButton } from "@/components/logout-button";
import { getSocialProvider } from "@/lib/social-provider";

export const dynamic = "force-dynamic";

function fmt(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("id-ID", {
    hour12: false,
    timeZone: "Asia/Jakarta",
  });
}

export default async function PostsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const provider = getSocialProvider();
  const publishMode = provider.name === "instagram" ? "instagram" : "manual";

  const [posts, items, accounts] = await Promise.all([
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        socialAccount: true,
        contentItem: {
          include: { mediaAsset: true, plan: { include: { niche: true } } },
        },
      },
    }),
    prisma.contentItem.findMany({
      orderBy: { dayIndex: "asc" },
      include: { plan: { include: { niche: true } } },
    }),
    prisma.socialAccount.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const formItems = items.map((i) => ({
    id: i.id,
    label: `${i.plan.niche.name} · ${i.plan.title} · Day ${i.dayIndex + 1}${
      i.hook ? ` — ${i.hook}` : ""
    }`,
    hook: i.hook,
    planId: i.planId,
    dayIndex: i.dayIndex,
    slides: Array.isArray(i.slides)
      ? (i.slides as { heading?: string; body?: string }[])
      : undefined,
    cta: i.cta,
  }));
  const formAccounts = accounts.map((a) => ({ id: a.id, handle: a.handle }));

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Posts</h1>
          <p className="text-sm text-neutral-500">{session.user?.email}</p>
        </div>
        <LogoutButton />
      </header>

      <Nav />

      <PostForm items={formItems} accounts={formAccounts} />

      <section className="space-y-3">
        <h2 className="font-medium">Queue ({posts.length})</h2>
        {posts.length === 0 ? (
          <p className="rounded border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            No posts yet. Queue one above.
          </p>
        ) : (
          <ul className="space-y-2">
            {posts.map((post) => (
              <li
                key={post.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {post.caption ?? post.contentItem?.hook ?? "Untitled post"}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    @{post.socialAccount.handle}
                    {post.contentItem
                      ? ` · ${post.contentItem.plan.niche.name} / ${post.contentItem.plan.title} · Day ${
                          post.contentItem.dayIndex + 1
                        }`
                      : ""}
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {post.format.toLowerCase()}
                    {post.contentItem?.mediaAsset
                      ? ` · ${post.contentItem.mediaAsset.kind.toLowerCase()}`
                      : ""}
                    {Array.isArray(post.carouselImages)
                      ? ` · ${post.carouselImages.length} images`
                      : ""}
                  </p>
                  <p className="mt-2 text-xs text-neutral-400">
                    <span
                      className={`font-medium ${
                        post.status === "PUBLISHED" ? "text-emerald-600" : ""
                      }`}
                    >
                      {post.status}
                    </span>
                    {post.approved ? " · approved" : " · not approved"}
                    {post.scheduledAt ? ` · scheduled ${fmt(post.scheduledAt)}` : ""}
                    {post.publishedAt ? ` · published ${fmt(post.publishedAt)}` : ""}
                    {post.externalPostId ? ` · IG ${post.externalPostId}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <PostActions
                    id={post.id}
                    approved={post.approved}
                    status={post.status}
                    publishMode={publishMode}
                  />
                  {publishMode === "instagram" &&
                    post.status === "PUBLISHED" &&
                    post.externalPostId && <PullInsightsButton id={post.id} />}
                  <DeleteButton
                    id={post.id}
                    name="post"
                    endpoint="/api/posts"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
