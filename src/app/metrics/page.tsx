import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { MetricForm } from "@/components/metric-form";
import { DeleteButton } from "@/components/delete-button";
import { LogoutButton } from "@/components/logout-button";
import {
  aggregateFunnel,
  engagement,
  conversionPercent,
  type FunnelRow,
} from "@/lib/metrics";

export const dynamic = "force-dynamic";

const metricNums = (m: {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  sales: number;
}) => ({
  impressions: m.impressions,
  reach: m.reach,
  likes: m.likes,
  comments: m.comments,
  shares: m.shares,
  clicks: m.clicks,
  sales: m.sales,
});

function FunnelTable({ rows }: { rows: FunnelRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
            <th className="py-2 pr-3 font-medium">Group</th>
            <th className="py-2 pr-3 text-right font-medium">Views</th>
            <th className="py-2 pr-3 text-right font-medium">Reach</th>
            <th className="py-2 pr-3 text-right font-medium">Engage</th>
            <th className="py-2 pr-3 text-right font-medium">Clicks</th>
            <th className="py-2 pr-3 text-right font-medium">Sales</th>
            <th className="py-2 text-right font-medium">Sales/Click</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-neutral-100">
              <td className="py-2 pr-3 font-medium">{r.key}</td>
              <td className="py-2 pr-3 text-right">{r.impressions}</td>
              <td className="py-2 pr-3 text-right">{r.reach}</td>
              <td className="py-2 pr-3 text-right">{engagement(r)}</td>
              <td className="py-2 pr-3 text-right">{r.clicks}</td>
              <td className="py-2 pr-3 text-right">{r.sales}</td>
              <td className="py-2 text-right">{conversionPercent(r)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function MetricsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [metrics, posts] = await Promise.all([
    prisma.metric.findMany({
      orderBy: { date: "desc" },
      include: {
        post: {
          include: {
            contentItem: { include: { plan: { include: { niche: true } } } },
          },
        },
      },
    }),
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: { contentItem: true, socialAccount: true },
    }),
  ]);

  const byNiche = aggregateFunnel(
    metrics.map((m) => ({
      key: m.post.contentItem?.plan.niche.name ?? "—",
      ...metricNums(m),
    }))
  );
  const byItem = aggregateFunnel(
    metrics.map((m) => {
      const ci = m.post.contentItem;
      return {
        key: ci
          ? `${ci.plan.niche.name} · Day ${ci.dayIndex + 1}${
              ci.hook ? ` — ${ci.hook.slice(0, 40)}` : ""
            }`
          : "—",
        ...metricNums(m),
      };
    })
  );
  const totals = aggregateFunnel(
    metrics.map((m) => ({ key: "Total", ...metricNums(m) }))
  );

  const formPosts = posts.map((p) => ({
    id: p.id,
    label: `@${p.socialAccount.handle} — ${
      p.caption ?? p.contentItem?.hook ?? "untitled"
    } (${p.status})`,
  }));

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Metrics</h1>
          <p className="text-sm text-neutral-500">{session.user?.email}</p>
        </div>
        <LogoutButton />
      </header>

      <Nav />

      <MetricForm posts={formPosts} />

      {totals.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-medium">Funnel</h2>
          <FunnelTable rows={totals} />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-medium">By niche</h2>
        {byNiche.length === 0 ? (
          <p className="rounded border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            No metrics yet. Add one above (or pull insights on a published post).
          </p>
        ) : (
          <FunnelTable rows={byNiche} />
        )}
      </section>

      {byItem.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-medium">By content item</h2>
          <FunnelTable rows={byItem} />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-medium">Entries ({metrics.length})</h2>
        {metrics.length === 0 ? (
          <p className="rounded border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            No metric entries yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {metrics.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-3"
              >
                <div className="min-w-0 text-xs text-neutral-600">
                  <p className="font-medium text-neutral-800">
                    {m.post.caption ?? m.post.contentItem?.hook ?? "Post"}
                  </p>
                  <p className="mt-1">
                    impressions {m.impressions} · reach {m.reach} · likes{" "}
                    {m.likes} · clicks {m.clicks} · sales {m.sales}
                  </p>
                </div>
                <DeleteButton id={m.id} name="metric" endpoint="/api/metrics" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
