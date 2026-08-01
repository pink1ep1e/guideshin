import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminNavTabs } from "@/components/admin/AdminNavTabs";
import BannerAdminClient from "@/components/admin/BannerAdminClient";
import { withPrisma } from "@/prisma/prisma-client";

export default async function AdminBannersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const items = await withPrisma((prisma) =>
    prisma.homeBannerSlide.findMany({
      orderBy: [{ half: "asc" }, { order: "asc" }, { id: "asc" }],
    }),
  ).catch(() => []);

  return (
    <div className="container-page py-8 pb-12">
      <h1 className="font-genshin mb-2 text-2xl font-bold">Баннер главной</h1>
      <p className="mb-6 text-sm font-medium text-muted-foreground">
        Персонажи в слайдере «Текущие молитвы» / «Вторая половина»
      </p>
      <AdminNavTabs active="banners" />
      <BannerAdminClient initial={items} />
    </div>
  );
}
