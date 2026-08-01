import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CharacterForm from "@/components/admin/CharacterForm";
import { withPrisma } from "@/prisma/prisma-client";
import { parseMaterials } from "@/lib/character-materials";

type Props = { params: Promise<{ id: string }> };

export default async function EditCharacterPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const character = await withPrisma((prisma) =>
    prisma.character.findUnique({ where: { id: Number(id) } }),
  );

  if (!character) notFound();

  return (
    <div className="container-page py-8 pb-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
            Админ
          </p>
          <h1 className="font-genshin text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Редактировать: {character.name}
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            /wiki/characters/{character.slug}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/wiki/characters/${character.slug}`}
            target="_blank"
            className="ui-btn-secondary"
          >
            Открыть на сайте
          </Link>
          <Link href="/admin/characters" className="ui-btn-secondary">
            ← К списку
          </Link>
        </div>
      </div>
      <CharacterForm
        initial={{
          id: character.id,
          name: character.name,
          slug: character.slug,
          image: character.image,
          splashImage: character.splashImage ?? "",
          rarity: character.rarity,
          element: character.element,
          weaponType: character.weaponType || "Меч",
          region: character.region || "Другое",
          sticker: character.sticker ?? "",
          shortDesc: character.shortDesc ?? "",
          contentHtml: character.contentHtml,
          levelMaterials: parseMaterials(character.levelMaterials),
          published: character.published,
          order: character.order,
        }}
      />
    </div>
  );
}
