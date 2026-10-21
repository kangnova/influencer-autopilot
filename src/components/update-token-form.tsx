"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UpdateTokenForm({
  accountId,
  handle,
}: {
  accountId: string;
  handle: string;
}) {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const res = await fetch(`/api/social-accounts/${accountId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error?.message ?? "Failed to update token");
      setLoading(false);
      return;
    }
    setSuccess("Token updated");
    setAccessToken("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="password"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder={`New token for @${handle}`}
          required
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update token"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && <p className="text-xs text-emerald-600">{success}</p>}
    </form>
  );
}
