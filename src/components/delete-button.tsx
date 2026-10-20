"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteButton({
  id,
  name,
  endpoint = "/api/niches",
}: {
  id: string;
  name: string;
  endpoint?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete "${name}"?`)) return;
    setLoading(true);
    const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      setLoading(false);
      window.alert("Failed to delete");
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
