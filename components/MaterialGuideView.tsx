import ItemIconCard from "@/components/ItemIconCard";
import {
  CharacterPortraitCard,
  GuideSection,
} from "@/components/GuideSections";
import { rarityBg } from "@/lib/genshin";
import {
  buildMaterialCharactersIntro,
  buildMaterialForgingIntro,
  buildMaterialForgingUseIntro,
  buildMaterialTeapotIntro,
  buildMaterialWeaponsIntro,
  hasForgingRecipe,
  isAllowedMapEmbedUrl,
  type MaterialGuideData,
} from "@/lib/wiki-guide-data";

export default function MaterialGuideView({
  materialName,
  rarityStars,
  image,
  data,
}: {
  materialName: string;
  rarityStars: number;
  image: string;
  data: MaterialGuideData;
}) {
  const charactersIntro =
    buildMaterialCharactersIntro(materialName, data.characters) || data.charactersIntro;
  const weaponsIntro =
    buildMaterialWeaponsIntro(materialName) || data.weaponsIntro;
  const teapotIntro =
    buildMaterialTeapotIntro(materialName) || data.teapotIntro;
  const forgingUseIntro =
    buildMaterialForgingUseIntro(materialName) || data.forgingUseIntro;
  const forgingIntro =
    buildMaterialForgingIntro(materialName, data.forgingDiagram) || data.forgingIntro;

  return (
    <div className="space-y-5">
      <section className="rounded-[20px] border border-black/[0.06] bg-white/90 p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap gap-5">
          <div
            className="relative flex h-[100px] w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-cover bg-center shadow-sm ring-1 ring-black/[0.06]"
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

      {data.characters.length > 0 && (
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
            {data.characters.map((c) => (
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

      {data.weapons.length > 0 && (
        <GuideSection title="Возвышаемое оружие" intro={<p>{weaponsIntro}</p>}>
          <div className="flex flex-wrap gap-3">
            {data.weapons.map((w) => (
              <ItemIconCard
                key={w.id}
                name={w.name}
                image={w.image}
                rarityStars={w.rarityStars}
                href={w.href}
                size="lg"
                showName
              />
            ))}
          </div>
        </GuideSection>
      )}

      {data.teapotItems.length > 0 && (
        <GuideSection title="Создание материалов" intro={<p>{teapotIntro}</p>}>
          <div className="flex flex-wrap gap-3">
            {data.teapotItems.map((item) => (
              <ItemIconCard
                key={item.id}
                name={item.name}
                image={item.image}
                rarityStars={item.rarityStars}
                href={item.href}
                size="md"
                showName
                variant="neutral"
              />
            ))}
          </div>
        </GuideSection>
      )}

      {data.alchemyUses.length > 0 && (
        <GuideSection
          large
          title="Применение в алхимии"
          intro={<p>{data.alchemyUseIntro || `«${materialName}» используется в алхимии:`}</p>}
        >
          <div className="flex flex-wrap gap-3">
            {data.alchemyUses.map((m) => (
              <ItemIconCard
                key={m.id}
                name={m.name}
                image={m.image}
                rarityStars={m.rarityStars}
                qty={m.qty}
                href={m.href}
                size="lg"
                showName
              />
            ))}
          </div>
        </GuideSection>
      )}

      {data.forgingUses.length > 0 && (
        <GuideSection
          large
          title="Применение в ковке"
          intro={<p>{forgingUseIntro}</p>}
        >
          <div className="flex flex-wrap gap-3">
            {data.forgingUses.map((item) => (
              <ItemIconCard
                key={item.id}
                name={item.name}
                image={item.image}
                rarityStars={item.rarityStars}
                href={item.href}
                size="lg"
                showName
              />
            ))}
          </div>
        </GuideSection>
      )}

      {data.sources.length > 0 && (
        <GuideSection
          title="Обычные и элитные враги"
          intro={<p>{data.sourcesIntro || `Источник материала «${materialName}»:`}</p>}
        >
          <div className="flex flex-wrap gap-3">
            {data.sources.map((s) => (
              <ItemIconCard
                key={s.id}
                name={s.name}
                image={s.image}
                rarityStars={1}
                href={s.href}
                size="md"
                showName
                variant="neutral"
              />
            ))}
          </div>
        </GuideSection>
      )}

      {data.alchemyCraft.length > 0 && (
        <GuideSection
          large
          title="Алхимия"
          intro={
            <p>
              {data.alchemyCraftIntro ||
                `Материал «${materialName}» можно получить в алхимии. Рецепт:`}
            </p>
          }
        >
          <div className="flex flex-wrap gap-3">
            {data.alchemyCraft.map((m) => (
              <ItemIconCard
                key={m.id}
                name={m.name}
                image={m.image}
                rarityStars={m.rarityStars}
                qty={m.qty}
                href={m.href}
                size="lg"
                showName
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
              className="!h-[100px] !w-[100px] shrink-0"
            />
            {forgingIntro ? (
              <div
                className="min-w-0 flex-1 text-base font-medium leading-relaxed text-muted-foreground sm:text-[17px] [&_a]:font-semibold [&_a]:text-[#c45a1f] [&_a]:underline-offset-2 hover:[&_a]:underline"
                dangerouslySetInnerHTML={{ __html: forgingIntro }}
              />
            ) : null}
          </div>
          {data.forgingIngredients.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
              {data.forgingIngredients.map((m) => (
                <ItemIconCard
                  key={m.id}
                  name={m.name}
                  image={m.image}
                  rarityStars={m.rarityStars}
                  qty={m.qty}
                  href={m.href}
                  size="md"
                  showName
                />
              ))}
            </div>
          )}
        </GuideSection>
      )}

      {(data.mapUrl || data.mapIntro || data.mapTitle) && (
        <GuideSection
          title={data.mapTitle || "Интерактивная карта"}
          intro={
            data.mapIntro || data.mapUrl ? (
              <p>
                {data.mapIntro || `Где находится материал «${materialName}»:`}
              </p>
            ) : undefined
          }
        >
          {data.mapUrl && isAllowedMapEmbedUrl(data.mapUrl) ? (
            <div className="overflow-hidden rounded-[14px] border border-black/[0.08] bg-[#0b1f44]/[0.03] shadow-sm">
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
