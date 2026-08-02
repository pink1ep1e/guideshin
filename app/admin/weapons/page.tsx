import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { withPrisma } from "@/prisma/prisma-client";
import AdminSignOutButton from "@/components/admin/SignOutButton";
import { AdminNavTabs } from "@/components/admin/AdminNavTabs";
import AdminWeaponsList from "@/components/admin/AdminWeaponsList";

export default async function AdminWeaponsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const items = await withPrisma((prisma) =>
    prisma.weapon.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        image: true,
        rarity: true,
        weaponType: true,
        published: true,
      },
    }),
  );

  return (
    <div className="container-page py-8 pb-12">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">Админ</p>
          <h1 className="font-genshin text-2xl font-bold tracking-tight sm:text-3xl">Оружие</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {items.length} шт. · новые сверху
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/weapons/new" className="ui-btn-primary">
            + Новое оружие
          </Link>
          <AdminSignOutButton />
        </div>
      </div>

      <AdminNavTabs active="weapons" />

      <AdminWeaponsList items={items} />
    </div>
  );
}
