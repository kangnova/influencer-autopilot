"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Item = { id: string; label: string };
type Account = { id: string; handle: string };

export function PostForm({
  items,
  accounts,
}: {
  items: Item[];
  accounts: Account[];
}) {
  const router = useRouter();
  const [contentItemId, setContentItemId] = useState("");
  const [socialAccountId, setSocialAccountId] = useState("");
  const [caption, setCaption] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const iso = scheduledAt ? new Date(scheduledAt).toISOString() : "";
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentItemId,
        socialAccountId,
        caption,
        scheduledAt: iso,
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error?.message ?? "Failed to create post");
      setLoading(false);
      return;
    }
    setCaption("");
    setScheduledAt("");
    setLoading(false);
    router.refresh();
  }

  const disabled =
    loading || items.length === 0 || accounts.length === 0 || !contentItemId || !socialAccountId;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-neutral-200 bg-white p-4"
    >
      <h2 className="mb-3 font-medium">Queue a post</h2>
      {error && (
        <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>
      )}
      <div className="space-y-3">
        <select
          value={contentItemId}
          onChange={(e) => setContentItemId(e.target.value)}
          required
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Select a content item (with media)...</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.label}
            </option>
          ))}
        </select>
        <select
          value={socialAccountId}
          onChange={(e) => setSocialAccountId(e.target.value)}
          required
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Select an account...</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              @{a.handle}
            </option>
          ))}
        </select>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (leave empty to use the item's hook)"
          rows={2}
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          type="datetime-local"
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? "Queuing..." : "Queue post"}
        </button>
        {items.length === 0 && (
          <p className="text-xs text-neutral-500">
            Attach media to a content item (on the Content plans page) before queuing a post.
          </p>
        )}
        {accounts.length === 0 && (
          <p className="text-xs text-neutral-500">
            Connect an Instagram account (on the Social accounts page) first.
          </p>
        )}
      </div>
    </form>
  );
}
