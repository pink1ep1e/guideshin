import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminNavTabs } from "@/components/admin/AdminNavTabs";
import PromosAdminClient from "@/components/admin/PromosAdminClient";
import { withPrisma } from "@/prisma/prisma-client";

export default async function AdminPromosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const rows = await withPrisma((prisma) =>
    prisma.promoCode.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] }),
  ).catch(() => []);

  const initial = rows.map((r) => ({
    id: r.id,
    code: r.code,
    reward: r.reward,
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
    published: r.published,
    order: r.order,
  }));

  return (
    <div className="container-page py-8 pb-12">
      <h1 className="font-genshin mb-2 text-2xl font-bold">Промокоды</h1>
      <p className="mb-6 text-sm font-medium text-muted-foreground">
        Коды в сайдбаре: срок действия и копирование на сайте
      </p>
      <AdminNavTabs active="promos" />
      <PromosAdminClient initial={initial} />
    </div>
  );
}
