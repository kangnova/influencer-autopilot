"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SocialAccountForm({ requiresToken }: { requiresToken: boolean }) {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [accountType, setAccountType] = useState("BUSINESS");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/social-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle, accessToken, accountType }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error?.message ?? "Failed to connect account");
      setLoading(false);
      return;
    }
    setHandle("");
    setAccessToken("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-neutral-200 bg-white p-4"
    >
      <h2 className="mb-3 font-medium">Connect Instagram</h2>
      {error && (
        <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>
      )}
      <div className="space-y-3">
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="Handle (e.g. myavatar)"
          required
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder={
            requiresToken
              ? "Access token (Business/Creator account)"
              : "Access token (optional — manual mode)"
          }
          type="password"
          required={requiresToken}
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <select
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="BUSINESS">Business</option>
          <option value="CREATOR">Creator</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? "Connecting..." : "Connect account"}
        </button>
      </div>
    </form>
  );
}
