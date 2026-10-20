"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PullInsightsButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pull() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/posts/${id}/insights`, { method: "POST" });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error?.message ?? "Failed");
      setBusy(false);
      return;
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={pull}
        disabled={busy}
        className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
      >
        {busy ? "Pulling..." : "Pull insights"}
      </button>
      {error && <p className="max-w-[12rem] text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
