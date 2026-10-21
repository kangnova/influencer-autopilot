"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Slide = { heading?: string; body?: string };
type Item = {
  id: string;
  label: string;
  hook?: string | null;
  planId: string;
  dayIndex: number;
  slides?: Slide[];
  cta?: string | null;
};
type Account = { id: string; handle: string };

/** Relative URLs of a carousel item's rendered slide images (deterministic names). */
function slideUrls(item: Item): string {
  const n = item.slides?.length ?? 0;
  return Array.from(
    { length: n },
    (_, i) => `/uploads/slides/${item.planId}/day${item.dayIndex + 1}-${i + 1}.png`
  ).join("\n");
}

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
  const [format, setFormat] = useState<"VIDEO" | "CAROUSEL">("VIDEO");
  const [caption, setCaption] = useState("");
  const [carouselText, setCarouselText] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = items.find((i) => i.id === contentItemId);

  function pickFormat(next: "VIDEO" | "CAROUSEL") {
    setFormat(next);
    // Convenience: auto-fill carousel slide URLs + caption from the selected item.
    if (next === "CAROUSEL" && selected) {
      if (selected.slides?.length) setCarouselText(slideUrls(selected));
      if (!caption) {
        setCaption([selected.hook, selected.cta].filter(Boolean).join("\n\n"));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const iso = scheduledAt
      ? new Date(`${scheduledAt}:00+07:00`).toISOString()
      : "";
    const carouselImages = carouselText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentItemId,
        socialAccountId,
        caption,
        format,
        carouselImages:
          format === "CAROUSEL" && carouselImages.length
            ? carouselImages
            : undefined,
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
    setCarouselText("");
    setScheduledAt("");
    setLoading(false);
    router.refresh();
  }

  const disabled =
    loading ||
    items.length === 0 ||
    accounts.length === 0 ||
    !contentItemId ||
    !socialAccountId ||
    (format === "CAROUSEL" &&
      carouselText.split("\n").filter((s) => s.trim()).length < 2);

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
          onChange={(e) => {
            const id = e.target.value;
            setContentItemId(id);
            const it = items.find((i) => i.id === id);
            if (format === "CAROUSEL" && it?.slides?.length) {
              setCarouselText(slideUrls(it));
              setCaption([it.hook, it.cta].filter(Boolean).join("\n\n"));
            }
          }}
          required
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Select a content item...</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.label}
              {i.slides?.length ? ` · ${i.slides.length} slides` : ""}
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

        <div>
          <div className="mb-1 text-xs font-medium text-neutral-600">Format</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => pickFormat("VIDEO")}
              className={`flex-1 rounded border px-3 py-2 text-sm font-medium ${
                format === "VIDEO"
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              Video / Reels
            </button>
            <button
              type="button"
              onClick={() => pickFormat("CAROUSEL")}
              className={`flex-1 rounded border px-3 py-2 text-sm font-medium ${
                format === "CAROUSEL"
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              Carousel
            </button>
          </div>
        </div>

        {format === "CAROUSEL" && selected?.slides && (
          <div className="rounded bg-neutral-50 p-2 text-xs text-neutral-600">
            {selected.slides.length} gambar slide otomatis diisi dari hasil render.
            Bisa diedit kalau mau ganti urutan/URL.
          </div>
        )}

        {format === "CAROUSEL" && (
          <textarea
            value={carouselText}
            onChange={(e) => setCarouselText(e.target.value)}
            placeholder={"https://.../slide-1.jpg\nhttps://.../slide-2.jpg\n..."}
            rows={4}
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        )}

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (leave empty to use the item's hook)"
          rows={2}
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <div>
          <div className="mb-1 text-xs font-medium text-neutral-600">
            Jam tayang (WIB)
          </div>
          <input
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            type="datetime-local"
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={disabled}
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? "Queuing..." : "Queue post"}
        </button>
        {items.length === 0 && (
          <p className="text-xs text-neutral-500">
            Generate a content plan first, then queue a post from it.
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
