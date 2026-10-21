import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { LogoutButton } from "@/components/logout-button";
import { AttachMediaForm } from "@/components/attach-media-form";

export const dynamic = "force-dynamic";

export default async function ContentPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const plan = await prisma.contentPlan.findUnique({
    where: { id },
    include: {
      niche: true,
      items: {
        orderBy: { dayIndex: "asc" },
        include: {
          mediaAsset: true,
          posts: { select: { status: true } },
        },
      },
    },
  });
  if (!plan) notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/content-plans" className="text-sm text-neutral-500 hover:underline">
            ← Content plans
          </Link>
          <h1 className="text-2xl font-bold">{plan.title}</h1>
          <p className="text-sm text-neutral-500">{plan.niche?.name}</p>
        </div>
        <LogoutButton />
      </header>

      <Nav />

      <section className="space-y-3">
        <h2 className="font-medium">Items ({plan.items.length})</h2>
        {plan.items.map((item) => {
          const published =
            item.status === "PUBLISHED" ||
            item.posts.some((p) => p.status === "PUBLISHED");
          return (
          <div
            key={item.id}
            className={`rounded-lg border p-4 ${
              published
                ? "border-emerald-300 bg-emerald-50"
                : "border-neutral-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">
                Day {item.dayIndex + 1}
                {item.hook ? ` — ${item.hook}` : ""}
              </p>
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${
                  published
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-neutral-400"
                }`}
              >
                {published ? "✓ Published" : item.status}
              </span>
            </div>

            {item.script && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-neutral-500">
                  Script
                </summary>
                <pre className="mt-1 whitespace-pre-wrap rounded bg-neutral-50 p-2 text-xs text-neutral-700">
                  {item.script}
                </pre>
              </details>
            )}

            {item.videoPrompt && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-neutral-500">
                  Video prompt
                </summary>
                <pre className="mt-1 whitespace-pre-wrap rounded bg-neutral-50 p-2 text-xs text-neutral-700">
                  {item.videoPrompt}
                </pre>
              </details>
            )}

            {Array.isArray(item.slides) && item.slides.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-neutral-500">
                  Carousel ({item.slides.length} slides)
                </summary>
                <div className="mt-2 space-y-1">
                  {item.slides.map((raw, i) => {
                    const s = raw as { heading?: string; body?: string };
                    return (
                      <div key={i} className="flex gap-2 rounded bg-neutral-50 p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/uploads/slides/${plan.id}/day${item.dayIndex + 1}-${i + 1}.png`}
                          alt={`Slide ${i + 1}`}
                          className="h-24 w-20 shrink-0 rounded object-cover"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium">
                            {i + 1}. {s.heading}
                          </p>
                          {s.body && (
                            <p className="mt-0.5 text-xs text-neutral-600">{s.body}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {item.cta && (
                    <div className="rounded bg-emerald-50 p-2 text-xs font-medium text-emerald-700">
                      CTA: {item.cta}
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="mt-3">
              {item.mediaAsset ? (
                <div className="flex items-center gap-3">
                  {item.mediaAsset.kind === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.mediaAsset.url}
                      alt={item.mediaAsset.url}
                      className="h-16 w-16 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <video
                      src={item.mediaAsset.url}
                      className="h-16 w-16 shrink-0 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">
                      {item.mediaAsset.url}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {item.mediaAsset.kind} · {item.mediaAsset.source}
                    </p>
                  </div>
                </div>
              ) : (
                <AttachMediaForm
                  target={{ contentItemId: item.id }}
                  label="Attach video"
                />
              )}
            </div>
          </div>
          );
        })}
      </section>
    </main>
  );
}
