/**
 * Pure funnel-rollup math for the metrics dashboard. Kept free of Prisma and UI
 * so the aggregation never drifts from what the dashboard shows.
 */

export interface FunnelRow {
  key: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  sales: number;
}

export type FunnelInput = Omit<FunnelRow, "key"> & { key: string };

export function aggregateFunnel(rows: FunnelInput[]): FunnelRow[] {
  const map = new Map<string, FunnelRow>();
  for (const r of rows) {
    const cur =
      map.get(r.key) ?? {
        key: r.key,
        impressions: 0,
        reach: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        clicks: 0,
        sales: 0,
      };
    cur.impressions += r.impressions;
    cur.reach += r.reach;
    cur.likes += r.likes;
    cur.comments += r.comments;
    cur.shares += r.shares;
    cur.clicks += r.clicks;
    cur.sales += r.sales;
    map.set(r.key, cur);
  }
  return [...map.values()];
}

export function engagement(r: FunnelRow): number {
  return r.likes + r.comments + r.shares;
}

/** Sales per click, percent, rounded; 0 when there are no clicks. */
export function conversionPercent(r: FunnelRow): number {
  return r.clicks > 0 ? Math.round((r.sales / r.clicks) * 100) : 0;
}
