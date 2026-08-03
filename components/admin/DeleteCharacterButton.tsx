"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminDelete } from "@/components/admin/AdminDeleteContext";

export default function DeleteCharacterButton({ id, name }: { id: number; name: string }) {
  const router = useRouter();
  const { requestDelete } = useAdminDelete();
  const [loading, setLoading] = useState(false);

  function handleDelete() {
    requestDelete({
      key: `character:${id}`,
      name,
      execute: async () => {
        setLoading(true);
        try {
          await fetch(`/api/admin/characters/${id}`, { method: "DELETE" });
          router.refresh();
        } finally {
          setLoading(false);
        }
      },
    });
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
