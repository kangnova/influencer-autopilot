"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Uploads a media file and (optionally) links it to a lesson or content item
 * in the same request. Exactly one of lessonId / contentItemId should be set;
 * both null uploads a standalone asset to the library.
 */
export function AttachMediaForm({
  target,
  label,
}: {
  target: { lessonId?: string; contentItemId?: string };
  label: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file first");
      return;
    }
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    if (target.lessonId) formData.append("lessonId", target.lessonId);
    if (target.contentItemId) formData.append("contentItemId", target.contentItemId);
    const res = await fetch("/api/media", { method: "POST", body: formData });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error?.message ?? "Failed to upload");
      setLoading(false);
      return;
    }
    if (inputRef.current) inputRef.current.value = "";
    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="w-full text-xs"
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
        >
          {loading ? "Uploading..." : label}
        </button>
      </form>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
