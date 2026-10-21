import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function ContentPlansPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const plans = await prisma.contentPlan.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      niche: true,
      items: {
        orderBy: { dayIndex: "asc" },
        include: { posts: { select: { status: true } } },
      },
    },
  });

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content plans</h1>
          <p className="text-sm text-neutral-500">{session.user?.email}</p>
        </div>
        <LogoutButton />
      </header>

      <Nav />

      <section className="space-y-3">
        <h2 className="font-medium">Your plans ({plans.length})</h2>
        {plans.length === 0 ? (
          <p className="rounded border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            No content plans yet. Generate one from a niche on the Niches page.
          </p>
        ) : (
          <ul className="space-y-2">
            {plans.map((p) => {
              const publishedCount = p.items.filter(
                (i) =>
                  i.status === "PUBLISHED" ||
                  i.posts.some((post) => post.status === "PUBLISHED"),
              ).length;
              return (
                <li
                  key={p.id}
                  className={`rounded-lg border p-4 ${
                    publishedCount > 0
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-neutral-200 bg-white"
                  }`}
                >
                  <Link href={`/content-plans/${p.id}`} className="font-medium hover:underline">
                    {p.title}
                  </Link>
                  <p className="mt-1 text-xs text-neutral-400">
                    {p.niche?.name ?? "—"} · {p.items.length} items · {p.status}
                    {publishedCount > 0 ? (
                      <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-700">
                        ✓ {publishedCount} published
                      </span>
                    ) : null}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
