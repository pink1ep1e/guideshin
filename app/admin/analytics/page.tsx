import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminSignOutButton from "@/components/admin/SignOutButton";
import { AdminNavTabs } from "@/components/admin/AdminNavTabs";
import AnalyticsAdminClient from "@/components/admin/AnalyticsAdminClient";

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  return (
    <div className="container-page py-8 pb-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
            Админ
          </p>
          <h1 className="font-genshin text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Аналитика
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Вы вошли как {session?.user?.name ?? "администратор"} · просмотры, IP, страны,
            Telegram
          </p>
        </div>
        <AdminSignOutButton />
      </div>

      <AdminNavTabs active="analytics" />
      <AnalyticsAdminClient />
    </div>
  );
}
