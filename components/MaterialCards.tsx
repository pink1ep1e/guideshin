import {
  MATERIAL_CATEGORY_LABEL,
  type CharacterMaterial,
} from "@/lib/character-materials";
import { rarityBg } from "@/lib/genshin";

function formatQty(n: number) {
  return n.toLocaleString("ru-RU");
}

export default function MaterialCards({
  materials,
  title = "Материалы для прокачки",
}: {
  materials: CharacterMaterial[];
  title?: string;
}) {
  if (materials.length === 0) return null;

  const grouped = materials.reduce<Record<string, CharacterMaterial[]>>((acc, m) => {
    (acc[m.category] ??= []).push(m);
    return acc;
  }, {});

  return (
    <section className="glass-panel relative overflow-hidden p-5 sm:p-6">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#189b8e] to-[#67d5cc]" />
      <p className="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
        Прокачка
      </p>
      <h2 className="font-genshin mb-5 text-xl tracking-wide text-foreground sm:text-2xl">
        {title}
      </h2>

      <div className="space-y-6">
        {Object.entries(grouped).map(([category, rows]) => (
          <div key={category}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              {MATERIAL_CATEGORY_LABEL[category as keyof typeof MATERIAL_CATEGORY_LABEL] ??
                category}
            </p>
            <div className="flex flex-wrap gap-3">
              {rows.map((m) => (
                <div
                  key={m.id}
                  className="w-[104px] overflow-hidden rounded-[16px] bg-card shadow-panel ring-1 ring-black/[0.06]"
                >
                  <div
                    className="relative flex h-[104px] items-center justify-center bg-cover bg-center p-2"
                    style={{ backgroundImage: `url(${rarityBg(m.rarityStars ?? 3)})` }}
                  >
                    {m.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.image}
                        alt={m.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground">Нет иконки</span>
                    )}
                    <span className="absolute bottom-1.5 right-1.5 rounded-full bg-[#189b8e] px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                      ×{formatQty(m.qty)}
                    </span>
                  </div>
                  <p className="px-1.5 py-2 text-center text-[11px] font-semibold leading-tight text-foreground">
                    {m.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
