"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Niche = { id: string; name: string };

export function PersonaForm({ niches }: { niches: Niche[] }) {
  const router = useRouter();
  const [nicheId, setNicheId] = useState("");
  const [name, setName] = useState("");
  const [identity, setIdentity] = useState("");
  const [avatarImageUrl, setAvatarImageUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/personas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nicheId, name, identity, avatarImageUrl }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error?.message ?? "Failed to create persona");
      setLoading(false);
      return;
    }
    setName("");
    setIdentity("");
    setAvatarImageUrl("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-neutral-200 bg-white p-4"
    >
      <h2 className="mb-3 font-medium">Add persona</h2>
      {error && (
        <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>
      )}
      <div className="space-y-3">
        <select
          value={nicheId}
          onChange={(e) => setNicheId(e.target.value)}
          required
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Select a niche...</option>
          {niches.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Persona name"
          required
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <textarea
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          placeholder="Identity (appearance, personality, voice — optional)"
          rows={3}
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          value={avatarImageUrl}
          onChange={(e) => setAvatarImageUrl(e.target.value)}
          placeholder="Avatar image URL (optional)"
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading || niches.length === 0}
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add persona"}
        </button>
        {niches.length === 0 && (
          <p className="text-xs text-neutral-500">
            Create a niche first before adding a persona.
          </p>
        )}
      </div>
    </form>
  );
}
