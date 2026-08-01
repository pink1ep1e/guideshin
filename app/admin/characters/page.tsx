import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { withPrisma } from "@/prisma/prisma-client";
import AdminSignOutButton from "@/components/admin/SignOutButton";
import DeleteCharacterButton from "@/components/admin/DeleteCharacterButton";
import { DuplicateEntityButton } from "@/components/admin/DuplicateEntityButton";
import { AdminNavTabs } from "@/components/admin/AdminNavTabs";
import { RARITY_LABEL, ELEMENT_LABEL, ELEMENT_SVG } from "@/lib/genshin";

export default async function AdminCharactersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const characters = await withPrisma((prisma) =>
    prisma.character.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] }),
  );

  return (
    <div className="container-page py-8 pb-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
            Админ
          </p>
          <h1 className="font-genshin text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Персонажи
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Вы вошли как {session?.user?.name ?? "администратор"} · {characters.length} шт.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/characters/new" className="ui-btn-primary">
            + Новый персонаж
          </Link>
          <AdminSignOutButton />
        </div>
      </div>

      <AdminNavTabs active="characters" />

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#189b8e]/8 text-xs uppercase tracking-[0.06em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-bold">Персонаж</th>
                <th className="px-4 py-3 font-bold">Редкость</th>
                <th className="px-4 py-3 font-bold">Стихия</th>
                <th className="px-4 py-3 font-bold">Статус</th>
                <th className="px-4 py-3 text-right font-bold">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {characters.map((c) => (
                <tr key={c.id} className="bg-white/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.image}
                        alt={c.name}
                        className="h-10 w-10 rounded-xl object-cover ring-1 ring-black/[0.06]"
                      />
                      <div>
                        <p className="font-semibold text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">/{c.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{RARITY_LABEL[c.rarity]}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ELEMENT_SVG[c.element]} alt="" className="h-4 w-4" />
                      {ELEMENT_LABEL[c.element]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.published ? (
                      <span className="rounded-full bg-[#189b8e]/12 px-2.5 py-1 text-xs font-bold text-[#189b8e]">
                        Опубликован
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                        Черновик
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/wiki/characters/${c.slug}`}
                        target="_blank"
                        className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-bold text-muted-foreground"
                      >
                        Открыть
                      </Link>
                      <Link
                        href={`/admin/characters/${c.id}/edit`}
                        className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-bold text-[#189b8e]"
                      >
                        Изменить
                      </Link>
                      <DuplicateEntityButton
                        apiBase="/api/admin/characters"
                        id={c.id}
                        name={c.name}
                        editBase="/admin/characters"
                      />
                      <DeleteCharacterButton id={c.id} name={c.name} />
                    </div>
                  </td>
                </tr>
              ))}
              {characters.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Персонажей пока нет.{" "}
                    <Link href="/admin/characters/new" className="font-bold text-[#189b8e]">
                      Добавьте первого
                    </Link>
                    .
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
