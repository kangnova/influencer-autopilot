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
        include: { mediaAsset: true },
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
        {plan.items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-neutral-200 bg-white p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">
                Day {item.dayIndex + 1}
                {item.hook ? ` — ${item.hook}` : ""}
              </p>
              <span className="text-xs text-neutral-400">{item.status}</span>
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
        ))}
      </section>
    </main>
  );
}
