import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import CharacterForm from "@/components/admin/CharacterForm";

export default async function NewCharacterPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  return (
    <div className="container-page py-8 pb-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
            Админ
          </p>
          <h1 className="font-genshin text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Новый персонаж
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Иконка, splash, редкость, стихия и HTML-гайд с Tailwind
          </p>
        </div>
        <Link href="/admin/characters" className="ui-btn-secondary">
          ← К списку
        </Link>
      </div>
      <CharacterForm />
    </div>
  );
}
