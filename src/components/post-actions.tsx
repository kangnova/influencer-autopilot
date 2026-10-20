"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PostActions({
  id,
  approved,
  status,
  publishMode,
}: {
  id: string;
  approved: boolean;
  status: string;
  publishMode: "manual" | "instagram";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function call(segment: "approve" | "publish", body?: { mode?: string }) {
    setBusy(segment);
    setError("");
    const res = await fetch(`/api/posts/${id}/${segment}`, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error?.message ?? "Failed");
      setBusy("");
      return;
    }
    setBusy("");
    router.refresh();
  }

  if (status === "PUBLISHED") return null;

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-1">
        {!approved ? (
          <button
            onClick={() => call("approve")}
            disabled={busy !== ""}
            className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
          >
            {busy === "approve" ? "Approving..." : "Approve"}
          </button>
        ) : (
          <>
            {publishMode === "instagram" && (
              <button
                onClick={() => call("publish")}
                disabled={busy !== ""}
                className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
              >
                {busy === "publish" ? "Publishing..." : "Publish"}
              </button>
            )}
            <button
              onClick={() => call("publish", { mode: "manual" })}
              disabled={busy !== ""}
              className="rounded border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
            >
              {busy === "publish" ? "Marking..." : "Mark published manually"}
            </button>
          </>
        )}
      </div>
      {error && <p className="max-w-[16rem] text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
