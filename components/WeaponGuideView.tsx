import ItemIconCard from "@/components/ItemIconCard";
import {
  CharacterPortraitCard,
  GuideSection,
} from "@/components/GuideSections";
import { sortByRarityDesc } from "@/lib/genshin";
import type { WeaponGuideData } from "@/lib/wiki-guide-data";

export default function WeaponGuideView({
  weaponName,
  data,
  loreByName = {},
}: {
  weaponName: string;
  data: WeaponGuideData;
  loreByName?: Record<string, string>;
}) {
  function loreOf(name: string) {
    return loreByName[name.trim().toLowerCase()] || undefined;
  }
  const materialsSummary = sortByRarityDesc(
    data.materialsSummary,
    (m) => m.rarityStars,
    (m) => m.name,
  );
  const recommended = sortByRarityDesc(
    data.recommended,
    (c) => c.rarityStars,
    (c) => c.name,
  );
  const hasMats = materialsSummary.length > 0 || data.phases.length > 0;
  const hasRec = recommended.length > 0;
  const hasGet = data.banners.length > 0 || data.howToGetIntro;
  const hasLevel = Boolean(data.levelUpNote);

  const matColCount = Math.max(
    3,
    ...data.phases.map((p) => p.materials.length),
    0,
  );

  if (!hasMats && !hasRec && !hasGet && !hasLevel) return null;

  return (
    <div className="space-y-5">
      {hasMats && (
        <GuideSection title="Возвышение оружия">
          <div className="space-y-4">
            <p className="text-sm font-medium leading-relaxed text-muted-foreground">
              {data.ascensionNote ||
                `Для полного возвышения оружия «${weaponName}» понадобятся следующие материалы:`}
            </p>

            {materialsSummary.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6">
                {materialsSummary.map((m) => (
                  <ItemIconCard
                    key={m.id}
                    name={m.name}
                    image={m.image}
                    rarityStars={m.rarityStars}
                    qty={m.qty}
                    href={m.href}
                    lore={loreOf(m.name)}
                    size="md"
                    fluid
                    preview
                  />
                ))}
              </div>
            )}

            {data.moraTotal > 0 && (
              <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                Помимо перечисленных материалов, также понадобится мора —{" "}
                <strong className="text-foreground">
                  {data.moraTotal.toLocaleString("ru-RU")}
                </strong>
                . Ресурсы, необходимые для возвышения до определённого ранга,
                указаны в таблице ниже.
              </p>
            )}

            {data.phases.length > 0 && (
              <div className="-mx-1 overflow-x-auto rounded-[14px] border border-black/[0.1] bg-white">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#eceff3] text-[12px] font-bold text-foreground">
                      <th className="border border-black/[0.08] px-2 py-2.5 text-center">
                        Фаза
                      </th>
                      <th className="border border-black/[0.08] px-2 py-2.5 text-center">
                        Макс. ур.
                      </th>
                      <th className="border border-black/[0.08] px-2 py-2.5 text-center">
                        Мора
                      </th>
                      {Array.from({ length: matColCount }, (_, i) => (
                        <th
                          key={i}
                          className="border border-black/[0.08] px-2 py-2.5 text-center"
                        >
                          Материал №{i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.phases.map((p, rowIdx) => (
                      <tr
                        key={p.id}
                        className={rowIdx % 2 === 1 ? "bg-[#f5f7fa]" : "bg-white"}
                      >
                        <td className="border border-black/[0.08] px-2 py-3 text-center font-bold text-foreground">
                          {p.phase}
                        </td>
                        <td className="border border-black/[0.08] px-2 py-3 text-center font-medium tabular-nums">
                          {p.maxLevel}
                        </td>
                        <td className="border border-black/[0.08] px-2 py-3 text-center font-medium tabular-nums">
                          {p.mora.toLocaleString("ru-RU")}
                        </td>
                        {Array.from({ length: matColCount }, (_, i) => {
                          const m = p.materials[i];
                          return (
                            <td
                              key={i}
                              className="border border-black/[0.08] px-2 py-2.5 text-center align-middle"
                            >
                              {m ? (
                                <div className="flex justify-center">
                                  <ItemIconCard
                                    name={m.name}
                                    image={m.image}
                                    rarityStars={m.rarityStars}
                                    qty={m.qty}
                                    href={m.href}
                                    lore={loreOf(m.name)}
                                    size="md"
                                    compact
                                    preview
                                  />
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </GuideSection>
      )}

      {hasLevel && (
        <GuideSection title="Повышение уровней оружия">
          <p className="text-sm font-medium leading-relaxed text-muted-foreground whitespace-pre-line">
            {data.levelUpNote}
          </p>
        </GuideSection>
      )}

      {hasRec && (
        <GuideSection
          title={`Кому лучше всего подойдёт «${weaponName}»?`}
          intro={
            data.recommendedIntro ? (
              <div
                className="[&_a]:font-semibold [&_a]:text-[#c45a1f] [&_a]:underline-offset-2 hover:[&_a]:underline"
                dangerouslySetInnerHTML={{ __html: data.recommendedIntro }}
              />
            ) : undefined
          }
        >
          <div className="flex flex-wrap gap-2.5">
            {recommended.map((c) => (
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

      {hasGet && (
        <GuideSection
          title={data.howToGetTitle || `Как получить оружие «${weaponName}»`}
          intro={
            data.howToGetIntro ? (
              <p className="[&_a]:font-semibold [&_a]:text-[#c45a1f]">{data.howToGetIntro}</p>
            ) : undefined
          }
        >
          {data.banners.length > 0 && (
            <div className="space-y-4">
              {data.banners.map((b) => {
                const tone =
                  b.typeTone === "blue"
                    ? "bg-[#4a90d9] text-white"
                    : b.typeTone === "purple"
                      ? "bg-[#8b6bc9] text-white"
                      : "bg-[#e8913a] text-white";
                const card = (
                  <div className="overflow-hidden rounded-[16px] ring-1 ring-black/[0.06]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.image}
                      alt={b.name}
                      className="block w-full object-cover object-center"
                    />
                    <div className="flex flex-wrap items-center gap-2 border-t border-black/[0.06] bg-white px-3 py-2.5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${tone}`}>
                        + {b.typeLabel}
                      </span>
                      <p className="text-sm font-semibold text-foreground">{b.name}</p>
                      {b.status ? (
                        <p className="text-xs font-medium text-muted-foreground">{b.status}</p>
                      ) : null}
                      {b.featured ? (
                        <p className="w-full text-xs font-medium text-muted-foreground">
                          {b.featured}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
                return b.href ? (
                  <a key={b.id} href={b.href} className="block transition hover:opacity-95">
                    {card}
                  </a>
                ) : (
                  <div key={b.id}>{card}</div>
                );
              })}
            </div>
          )}
        </GuideSection>
      )}
    </div>
  );
}
