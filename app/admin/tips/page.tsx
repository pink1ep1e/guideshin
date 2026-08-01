import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminNavTabs } from "@/components/admin/AdminNavTabs";
import TipsAdminClient from "@/components/admin/TipsAdminClient";
import { withPrisma } from "@/prisma/prisma-client";

export default async function AdminTipsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const items = await withPrisma((prisma) =>
    prisma.dailyTip.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] }),
  ).catch(() => []);

  return (
    <div className="container-page py-8 pb-12">
      <h1 className="font-genshin mb-2 text-2xl font-bold">Советы дня</h1>
      <p className="mb-6 text-sm font-medium text-muted-foreground">
        Меняются каждый день по кругу среди опубликованных
      </p>
      <AdminNavTabs active="tips" />
      <TipsAdminClient initial={items} />
    </div>
  );
}
