"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteCharacterButton({ id, name }: { id: number; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Удалить персонажа «${name}»?`)) return;
    setLoading(true);
    await fetch(`/api/admin/characters/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
    >
      {loading ? "…" : "Удалить"}
    </button>
  );
}
