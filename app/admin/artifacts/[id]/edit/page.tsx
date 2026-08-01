import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import WikiEntityForm from "@/components/admin/WikiEntityForm";
import { withPrisma } from "@/prisma/prisma-client";

type Props = { params: Promise<{ id: string }> };

export default async function EditArtifactPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  const { id } = await params;
  const item = await withPrisma((prisma) =>
    prisma.artifact.findUnique({ where: { id: Number(id) } }),
  );
  if (!item) notFound();

  return (
    <div className="container-page py-8 pb-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-genshin text-2xl font-bold">Редактировать: {item.name}</h1>
        <Link href="/admin/artifacts" className="ui-btn-secondary">
          ← К списку
        </Link>
      </div>
      <WikiEntityForm
        kind="artifact"
        initial={{
          id: item.id,
          name: item.name,
          slug: item.slug,
          image: item.image,
          rarity: item.rarity,
          sticker: item.sticker ?? "",
          region: item.region ?? "Другое",
          shortDesc: item.shortDesc ?? "",
          contentHtml: item.contentHtml,
          published: item.published,
          order: item.order,
        }}
      />
    </div>
  );
}
