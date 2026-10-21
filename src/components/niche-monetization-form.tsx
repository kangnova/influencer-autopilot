"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NicheMonetizationForm({
  id,
  monetizationType,
}: {
  id: string;
  monetizationType: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function setType(next: "OWN_PRODUCT" | "AFFILIATE") {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/niches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monetizationType: next }),
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

  const active =
    "rounded border border-neutral-900 bg-neutral-900 px-2 py-1 text-xs font-medium text-white";
  const idle =
    "rounded border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100";

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-1 text-xs text-neutral-500">
        <span>Monetisasi:</span>
        <button
          type="button"
          disabled={loading}
          onClick={() => setType("OWN_PRODUCT")}
          className={monetizationType === "OWN_PRODUCT" ? active : idle}
        >
          Produk sendiri
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => setType("AFFILIATE")}
          className={monetizationType === "AFFILIATE" ? active : idle}
        >
          Affiliate
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
