"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PostOption = { id: string; label: string };

const FIELDS = [
  "impressions",
  "reach",
  "likes",
  "comments",
  "shares",
  "clicks",
  "sales",
] as const;

export function MetricForm({ posts }: { posts: PostOption[] }) {
  const router = useRouter();
  const [postId, setPostId] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, v: string) {
    setValues((prev) => ({ ...prev, [field]: v }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const body: Record<string, unknown> = { postId };
    for (const f of FIELDS) {
      const v = values[f];
      if (v !== undefined && v !== "") {
        const n = Number(v);
        if (Number.isFinite(n) && n >= 0) body[f] = Math.round(n);
      }
    }
    const res = await fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error?.message ?? "Failed to add metric");
      setLoading(false);
      return;
    }
    setPostId("");
    setValues({});
    setLoading(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-neutral-200 bg-white p-4"
    >
      <h2 className="mb-3 font-medium">Add metric (manual)</h2>
      {error && (
        <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>
      )}
      <div className="space-y-3">
        <select
          value={postId}
          onChange={(e) => setPostId(e.target.value)}
          required
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Select a post...</option>
          {posts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FIELDS.map((f) => (
            <input
              key={f}
              value={values[f] ?? ""}
              onChange={(e) => set(f, e.target.value)}
              type="number"
              min="0"
              placeholder={f}
              className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          ))}
        </div>
        <button
          type="submit"
          disabled={loading || !postId}
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add metric"}
        </button>
        {posts.length === 0 && (
          <p className="text-xs text-neutral-500">Publish a post first.</p>
        )}
      </div>
    </form>
  );
}
