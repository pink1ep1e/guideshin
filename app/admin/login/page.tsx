"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      userName,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Неверный логин или пароль");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <form onSubmit={handleSubmit} className="panel w-full max-w-sm p-6">
        <h1 className="font-genshin text-2xl font-bold tracking-tight text-foreground">
          Вход в админ-панель
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Guideshin</p>

        <div className="mt-5 flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Логин</label>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
              required
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="ui-btn-primary mt-5 w-full"
        >
          {loading ? "Входим…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
