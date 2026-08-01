import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { withPrisma } from "@/prisma/prisma-client";
import AdminSignOutButton from "@/components/admin/SignOutButton";
import DeleteEntityButton, { AdminNavTabs } from "@/components/admin/AdminNavTabs";
import { DuplicateEntityButton } from "@/components/admin/DuplicateEntityButton";
import { MATERIAL_CATEGORY_LABEL } from "@/lib/character-materials";

export default async function AdminMaterialsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const items = await withPrisma((prisma) =>
    prisma.material.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] }),
  );

  return (
    <div className="container-page py-8 pb-12">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">Админ</p>
          <h1 className="font-genshin text-2xl font-bold tracking-tight sm:text-3xl">Материалы</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{items.length} шт.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/materials/new" className="ui-btn-primary">
            + Новый материал
          </Link>
          <AdminSignOutButton />
        </div>
      </div>

      <AdminNavTabs active="materials" />

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#189b8e]/8 text-xs uppercase tracking-[0.06em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-bold">Материал</th>
                <th className="px-4 py-3 font-bold">Категория</th>
                <th className="px-4 py-3 font-bold">★</th>
                <th className="px-4 py-3 font-bold">Статус</th>
                <th className="px-4 py-3 text-right font-bold">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {items.map((m) => (
                <tr key={m.id} className="bg-white/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.image || "/images/legend-bg.jpg"}
                        alt=""
                        className="h-10 w-10 rounded-xl object-contain ring-1 ring-black/[0.06]"
                      />
                      <div>
                        <p className="font-semibold">{m.name}</p>
                        <p className="text-xs text-muted-foreground">/{m.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {MATERIAL_CATEGORY_LABEL[m.category as keyof typeof MATERIAL_CATEGORY_LABEL] ??
                      m.category}
                  </td>
                  <td className="px-4 py-3 font-medium">{m.rarityStars}★</td>
                  <td className="px-4 py-3">
                    {m.published ? (
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
                        href={`/wiki/materials/${m.slug}`}
                        target="_blank"
                        className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-bold text-muted-foreground"
                      >
                        Открыть
                      </Link>
                      <Link
                        href={`/admin/materials/${m.id}/edit`}
                        className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-bold text-[#189b8e]"
                      >
                        Править
                      </Link>
                      <DuplicateEntityButton
                        apiBase="/api/admin/materials"
                        id={m.id}
                        name={m.name}
                        editBase="/admin/materials"
                      />
                      <DeleteEntityButton apiBase="/api/admin/materials" id={m.id} name={m.name} />
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Пока нет материалов — создайте первый.
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
