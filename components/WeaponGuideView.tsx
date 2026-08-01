import ItemIconCard from "@/components/ItemIconCard";
import {
  CharacterPortraitCard,
  GuideSection,
} from "@/components/GuideSections";
import type { WeaponGuideData } from "@/lib/wiki-guide-data";

export default function WeaponGuideView({
  weaponName,
  data,
}: {
  weaponName: string;
  data: WeaponGuideData;
}) {
  const hasMats = data.materialsSummary.length > 0 || data.phases.length > 0;
  const hasRec = data.recommended.length > 0;
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

            {data.materialsSummary.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {data.materialsSummary.map((m) => (
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
                                    size="md"
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
            {data.recommended.map((c) => (
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
            <div className="grid gap-3 sm:grid-cols-2">
              {data.banners.map((b) => {
                const tone =
                  b.typeTone === "blue"
                    ? "bg-[#4a90d9] text-white"
                    : b.typeTone === "purple"
                      ? "bg-[#8b6bc9] text-white"
                      : "bg-[#e8913a] text-white";
                const card = (
                  <div className="relative min-h-[140px] overflow-hidden rounded-[16px] bg-[#0b1f44]/[0.06]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.image}
                      alt={b.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
                    <div className="relative z-10 flex h-full min-h-[140px] flex-col justify-between p-4">
                      <div>
                        <h3 className="font-display text-lg font-bold text-white">{b.name}</h3>
                        <p className="mt-0.5 text-xs font-medium text-white/75">
                          {b.status || "Доступна Молитва"}
                        </p>
                        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${tone}`}>
                          + {b.typeLabel}
                        </span>
                      </div>
                      {b.featured && (
                        <p className="text-sm font-bold text-white drop-shadow">{b.featured}</p>
                      )}
                    </div>
                  </div>
                );
                return b.href ? (
                  <a key={b.id} href={b.href} className="block">
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
