import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import WikiEntityForm from "@/components/admin/WikiEntityForm";

export default async function NewWeaponPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  return (
    <div className="container-page py-8 pb-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-genshin text-2xl font-bold">Новое оружие</h1>
        <Link href="/admin/weapons" className="ui-btn-secondary">
          ← К списку
        </Link>
      </div>
      <WikiEntityForm kind="weapon" />
    </div>
  );
}
