"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NicheSalesLinkForm({
  id,
  salesLinkUrl,
}: {
  id: string;
  salesLinkUrl: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(salesLinkUrl ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/niches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salesLinkUrl: value }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error?.message ?? "Failed to save");
      setLoading(false);
      return;
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="mt-2 space-y-1">
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Sales link (Lynk.id) — https://..."
          className="w-full rounded border border-neutral-300 px-2 py-1 text-xs"
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
