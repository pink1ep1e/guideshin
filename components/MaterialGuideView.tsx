import ItemIconCard from "@/components/ItemIconCard";
import {
  CharacterPortraitCard,
  GuideSection,
} from "@/components/GuideSections";
import { rarityBg, sortByRarityDesc } from "@/lib/genshin";
import {
  buildMaterialAlchemyCraftIntro,
  buildMaterialAlchemyUseIntro,
  buildMaterialCharactersIntro,
  buildMaterialForgingIntro,
  buildMaterialForgingUseIntro,
  buildMaterialSourcesIntro,
  buildMaterialTeapotIntro,
  buildMaterialWeaponsIntro,
  hasForgingRecipe,
  isAllowedMapEmbedUrl,
  type MaterialGuideData,
  type WeaponHoverMeta,
} from "@/lib/wiki-guide-data";

export default function MaterialGuideView({
  materialName,
  rarityStars,
  image,
  data,
  loreByName = {},
  weaponMetaByName = {},
}: {
  materialName: string;
  rarityStars: number;
  image: string;
  data: MaterialGuideData;
  /** Короткий лор по имени предмета (lowercase) для hover-превью. */
  loreByName?: Record<string, string>;
  /** Статы оружия по имени (lowercase) для hover-превью. */
  weaponMetaByName?: Record<string, WeaponHoverMeta>;
}) {
  function loreOf(name: string) {
    return loreByName[name.trim().toLowerCase()] || undefined;
  }
  function weaponMetaOf(name: string) {
    return weaponMetaByName[name.trim().toLowerCase()] || undefined;
  }
  const characters = sortByRarityDesc(
    data.characters,
    (c) => c.rarityStars,
    (c) => c.name,
  );
  const weapons = sortByRarityDesc(
    data.weapons,
    (w) => w.rarityStars,
    (w) => w.name,
  );
  const teapotItems = sortByRarityDesc(
    data.teapotItems,
    (m) => m.rarityStars,
    (m) => m.name,
  );
  const alchemyUses = sortByRarityDesc(
    data.alchemyUses,
    (m) => m.rarityStars,
    (m) => m.name,
  );
  const forgingUses = sortByRarityDesc(
    data.forgingUses,
    (m) => m.rarityStars,
    (m) => m.name,
  );
  const alchemyCraft = sortByRarityDesc(
    data.alchemyCraft,
    (m) => m.rarityStars,
    (m) => m.name,
  );
  const forgingIngredients = sortByRarityDesc(
    data.forgingIngredients,
    (m) => m.rarityStars,
    (m) => m.name,
  );

  const charactersIntro =
    buildMaterialCharactersIntro(materialName, characters) || data.charactersIntro;
  const weaponsIntro =
    buildMaterialWeaponsIntro(materialName) || data.weaponsIntro;
  const teapotIntro =
    buildMaterialTeapotIntro(materialName) || data.teapotIntro;
  const forgingUseIntro =
    buildMaterialForgingUseIntro(materialName) || data.forgingUseIntro;
  const forgingIntro =
    buildMaterialForgingIntro(materialName, data.forgingDiagram) || data.forgingIntro;
  const sourcesIntro =
    buildMaterialSourcesIntro(materialName, data.sources) || data.sourcesIntro;
  const alchemyCraftIntro =
    buildMaterialAlchemyCraftIntro(materialName) || data.alchemyCraftIntro;
  const alchemyUseIntro =
    buildMaterialAlchemyUseIntro(materialName) || data.alchemyUseIntro;

  return (
    <div className="space-y-5">
      <section className="rounded-[20px] bg-white/90 p-5 shadow-soft sm:p-6 dark:bg-[hsl(var(--card))] dark:shadow-none">
        <div className="flex flex-wrap gap-5">
          <div
            className="relative flex h-[100px] w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-cover bg-center shadow-sm"
            style={{ backgroundImage: `url(${rarityBg(rarityStars)})` }}
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={materialName} className="h-full w-full object-contain p-1" />
            ) : (
              <span className="px-2 text-center text-[10px] font-bold text-muted-foreground">
                Нет иконки
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {data.description ? (
              <div
                className="text-base font-medium leading-relaxed text-foreground [&_a]:font-semibold [&_a]:text-[#c45a1f] [&_a]:underline-offset-2 hover:[&_a]:underline"
                dangerouslySetInnerHTML={{ __html: data.description }}
              />
            ) : (
              <p className="text-base font-medium text-muted-foreground">
                Материал для прокачки в Genshin Impact.
              </p>
            )}
            {data.lore && (
              <p className="mt-3 text-sm italic leading-relaxed text-muted-foreground">{data.lore}</p>
            )}
          </div>
        </div>
      </section>

      {characters.length > 0 && (
        <GuideSection
          title="Улучшаемые персонажи"
          intro={
            charactersIntro ? (
              <div
                className="[&_a]:font-semibold [&_a]:text-[#c45a1f] [&_a]:underline-offset-2 hover:[&_a]:underline"
                dangerouslySetInnerHTML={{ __html: charactersIntro }}
              />
            ) : undefined
          }
        >
          <div className="flex flex-wrap gap-2.5">
            {characters.map((c) => (
              <CharacterPortraitCard
                key={c.id}
                item={{
                  name: c.name,
                  image: c.image,
                  element: c.element,
                  rarityStars: c.rarityStars,
                  href: c.href,
                }}
              />
            ))}
          </div>
        </GuideSection>
      )}

      {weapons.length > 0 && (
        <GuideSection title="Возвышаемое оружие" intro={<p>{weaponsIntro}</p>}>
          <div className="flex flex-wrap gap-2.5">
            {weapons.map((w) => (
              <ItemIconCard
                key={w.id}
                name={w.name}
                image={w.image}
                rarityStars={w.rarityStars}
                href={w.href}
                lore={loreOf(w.name)}
                weaponMeta={weaponMetaOf(w.name)}
                size="md"
                preview
              />
            ))}
          </div>
        </GuideSection>
      )}

      {teapotItems.length > 0 && (
        <GuideSection title="Создание материалов" intro={<p>{teapotIntro}</p>}>
          <div className="flex flex-wrap gap-2.5">
            {teapotItems.map((item) => (
              <ItemIconCard
                key={item.id}
                name={item.name}
                image={item.image}
                rarityStars={item.rarityStars}
                href={item.href}
                lore={loreOf(item.name)}
                size="md"
                variant="neutral"
                preview
              />
            ))}
          </div>
        </GuideSection>
      )}

      {alchemyUses.length > 0 && (
        <GuideSection
          large
          title="Применение в алхимии"
          intro={<p>{alchemyUseIntro}</p>}
        >
          <div className="flex flex-wrap gap-2.5">
            {alchemyUses.map((m) => (
              <ItemIconCard
                key={m.id}
                name={m.name}
                image={m.image}
                rarityStars={m.rarityStars}
                qty={m.qty}
                href={m.href}
                lore={loreOf(m.name)}
                size="md"
                preview
              />
            ))}
          </div>
        </GuideSection>
      )}

      {forgingUses.length > 0 && (
        <GuideSection
          large
          title="Применение в ковке"
          intro={<p>{forgingUseIntro}</p>}
        >
          <div className="flex flex-wrap gap-2.5">
            {forgingUses.map((item) => (
              <ItemIconCard
                key={item.id}
                name={item.name}
                image={item.image}
                rarityStars={item.rarityStars}
                href={item.href}
                lore={loreOf(item.name)}
                weaponMeta={weaponMetaOf(item.name)}
                size="md"
                preview
              />
            ))}
          </div>
        </GuideSection>
      )}

      {data.sources.length > 0 && (
        <GuideSection
          title="Обычные и элитные враги"
          intro={
            sourcesIntro ? (
              <p
                className="[&_a]:font-semibold [&_a]:text-[#c45a1f] [&_a]:underline-offset-2 hover:[&_a]:underline"
                dangerouslySetInnerHTML={{ __html: sourcesIntro }}
              />
            ) : null
          }
        >
          <div className="flex flex-wrap gap-2.5">
            {data.sources.map((s) => (
              <ItemIconCard
                key={s.id}
                name={s.name}
                image={s.image}
                rarityStars={4}
                href={s.href}
                size="md"
                variant="neutral"
              />
            ))}
          </div>
        </GuideSection>
      )}

      {alchemyCraft.length > 0 && (
        <GuideSection
          large
          title="Алхимия"
          intro={<p>{alchemyCraftIntro}</p>}
        >
          <div className="flex flex-wrap gap-2.5">
            {alchemyCraft.map((m) => (
              <ItemIconCard
                key={m.id}
                name={m.name}
                image={m.image}
                rarityStars={m.rarityStars}
                qty={m.qty}
                href={m.href}
                lore={loreOf(m.name)}
                size="md"
                preview
              />
            ))}
          </div>
        </GuideSection>
      )}

      {hasForgingRecipe(data) && (
        <GuideSection large title="Рецепты ковки">
          <div className="flex flex-wrap items-start gap-4 sm:gap-5">
            <ItemIconCard
              name={materialName}
              image={image}
              rarityStars={rarityStars}
              size="lg"
              compact
              className="!h-[100px] !w-[100px] shrink-0"
            />
            {forgingIntro ? (
              <div
                className="min-w-0 flex-1 text-base font-medium leading-relaxed text-muted-foreground sm:text-[17px] [&_a]:font-semibold [&_a]:text-[#c45a1f] [&_a]:underline-offset-2 hover:[&_a]:underline"
                dangerouslySetInnerHTML={{ __html: forgingIntro }}
              />
            ) : null}
          </div>
          {forgingIngredients.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2.5">
              {forgingIngredients.map((m) => (
                <ItemIconCard
                  key={m.id}
                  name={m.name}
                  image={m.image}
                  rarityStars={m.rarityStars}
                  qty={m.qty}
                  href={m.href}
                  lore={loreOf(m.name)}
                  weaponMeta={weaponMetaOf(m.name)}
                  size="md"
                  preview
                />
              ))}
            </div>
          )}
        </GuideSection>
      )}

      {(data.mapUrl || data.mapIntro) && (
        <GuideSection
          title={data.mapTitle || "Интерактивная карта"}
          intro={
            <p>
              {data.mapIntro || `Где находится материал «${materialName}»:`}
            </p>
          }
        >
          {data.mapUrl && isAllowedMapEmbedUrl(data.mapUrl) ? (
            <div className="overflow-hidden rounded-[14px] bg-[#0b1f44]/[0.03] shadow-sm dark:bg-white/[0.04]">
              <iframe
                src={data.mapUrl.trim()}
                title={data.mapTitle || `Карта: ${materialName}`}
                className="block h-[min(70vh,560px)] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allow="fullscreen; geolocation"
              />
              <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] bg-white/80 px-3 py-2">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Карта Hoyolab · можно масштабировать и двигать внутри окна
                </p>
                <a
                  href={data.mapUrl.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-[11px] font-bold text-[#189b8e] hover:underline"
                >
                  Открыть в новой вкладке
                </a>
              </div>
            </div>
          ) : data.mapUrl ? (
            <div className="rounded-[14px] border border-dashed border-black/[0.1] bg-[#0b1f44]/[0.03] px-4 py-6 text-center text-sm font-medium text-muted-foreground">
              Ссылка на карту не из Hoyolab.{" "}
              <a
                href={data.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#189b8e] hover:underline"
              >
                Открыть ссылку
              </a>
            </div>
          ) : (
            <div className="flex min-h-[160px] items-center justify-center rounded-[14px] border border-dashed border-black/[0.1] bg-[#0b1f44]/[0.03] px-4 py-8 text-center text-sm font-medium text-muted-foreground">
              Добавьте ссылку на карту в админке материала
            </div>
          )}
        </GuideSection>
      )}
    </div>
  );
}
