/**
 * Пример HTML-гайда с Tailwind-классами.
 * Файл сканируется Tailwind — классы из шаблона попадут в CSS.
 */
export function buildGuideTemplate(name = "Персонаж"): string {
  return `<!-- Гайд: замените пути к картинкам на свои -->
<section class="space-y-8">
  <div>
    <p class="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">Обзор</p>
    <h2 class="font-genshin mb-3 text-2xl tracking-wide text-foreground">О персонаже</h2>
    <p class="text-base font-medium leading-relaxed text-muted-foreground">
      Краткий гайд на <strong class="text-foreground">${name}</strong>: сильные стороны, роли в команде
      и приоритет прокачки. Ниже — оружие, артефакты и примеры отрядов.
    </p>
  </div>

  <div>
    <p class="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">Роль</p>
    <h2 class="font-genshin mb-3 text-2xl tracking-wide text-foreground">Для чего брать</h2>
    <div class="flex flex-wrap gap-2">
      <span class="rounded-full bg-[#189b8e]/12 px-3 py-1.5 text-xs font-bold text-[#189b8e]">Основной DPS</span>
      <span class="rounded-full bg-[#189b8e]/12 px-3 py-1.5 text-xs font-bold text-[#189b8e]">Саб-DPS</span>
      <span class="rounded-full bg-navy/[0.06] px-3 py-1.5 text-xs font-bold text-navy/70">Гидро апплай</span>
    </div>
  </div>

  <div>
    <p class="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">Оружие</p>
    <h2 class="font-genshin mb-4 text-2xl tracking-wide text-foreground">Рекомендуемое оружие</h2>
    <div class="flex flex-wrap gap-3">
      <!-- Карточка оружия 5★ -->
      <div class="w-[122px] overflow-hidden rounded-[18px] bg-card shadow-panel ring-1 ring-black/[0.06]">
        <div class="relative h-[122px] bg-cover bg-center" style="background-image:url(/images/legend-bg.jpg)">
          <img src="/images/mini-artifacts/Zolotaya-truppa.webp" alt="Сигнатурка" class="h-full w-full object-cover" />
          <div class="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent"></div>
          <img src="/images/stars/Quality_star_5.svg" alt="" class="absolute bottom-1.5 left-1/2 h-4 w-auto -translate-x-1/2" />
        </div>
        <div class="px-1.5 py-2.5 text-center">
          <p class="font-genshin text-[13px] leading-tight text-foreground">Сигнатурка</p>
          <p class="mt-1 text-[10px] font-bold text-[#189b8e]">Лучший выбор</p>
        </div>
      </div>

      <!-- Карточка оружия 4★ -->
      <div class="w-[122px] overflow-hidden rounded-[18px] bg-card shadow-panel ring-1 ring-black/[0.06]">
        <div class="relative h-[122px] bg-cover bg-center" style="background-image:url(/images/epic-bg.jpg)">
          <img src="/images/mini-artifacts/Pozolochennye-sny.webp" alt="Альтернатива" class="h-full w-full object-cover" />
          <div class="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent"></div>
          <img src="/images/stars/Quality_star_4.svg" alt="" class="absolute bottom-1.5 left-1/2 h-4 w-auto -translate-x-1/2" />
        </div>
        <div class="px-1.5 py-2.5 text-center">
          <p class="font-genshin text-[13px] leading-tight text-foreground">Альтернатива</p>
          <p class="mt-1 text-[10px] font-bold text-muted-foreground">F2P / 4★</p>
        </div>
      </div>
    </div>
    <p class="mt-3 text-sm font-medium text-muted-foreground">
      Подставьте свои пути к иконкам оружия вместо примеров выше.
    </p>
  </div>

  <div>
    <p class="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">Артефакты</p>
    <h2 class="font-genshin mb-4 text-2xl tracking-wide text-foreground">Сеты</h2>
    <div class="flex flex-wrap gap-3">
      <div class="w-[122px] overflow-hidden rounded-[18px] bg-card shadow-panel ring-1 ring-black/[0.06]">
        <div class="relative h-[122px] bg-cover bg-center" style="background-image:url(/images/legend-bg.jpg)">
          <img src="/images/mini-artifacts/Zolotaya-truppa.webp" alt="Золотая труппа" class="h-full w-full object-cover" />
          <div class="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent"></div>
          <img src="/images/stars/Quality_star_5.svg" alt="" class="absolute bottom-1.5 left-1/2 h-4 w-auto -translate-x-1/2" />
        </div>
        <p class="font-genshin line-clamp-2 min-h-[2.5em] px-1.5 py-2.5 text-center text-[12px] leading-snug tracking-wide text-foreground">Золотая труппа</p>
      </div>
      <div class="w-[122px] overflow-hidden rounded-[18px] bg-card shadow-panel ring-1 ring-black/[0.06]">
        <div class="relative h-[122px] bg-cover bg-center" style="background-image:url(/images/legend-bg.jpg)">
          <img src="/images/mini-artifacts/Okhota-na-ten.webp" alt="Охотник" class="h-full w-full object-cover" />
          <div class="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent"></div>
          <img src="/images/stars/Quality_star_5.svg" alt="" class="absolute bottom-1.5 left-1/2 h-4 w-auto -translate-x-1/2" />
        </div>
        <p class="font-genshin line-clamp-2 min-h-[2.5em] px-1.5 py-2.5 text-center text-[12px] leading-snug tracking-wide text-foreground">Охотник</p>
      </div>
    </div>
    <div class="mt-4 rounded-[16px] bg-[#189b8e]/8 p-4 text-sm font-medium text-foreground/80">
      <p><strong>Статы:</strong> Крит. шанс / Крит. урон · ATK% · бонус стихии</p>
      <p class="mt-1"><strong>Приоритет:</strong> Крит → ATK% → МС / восстановление энергии</p>
    </div>
  </div>

  <div>
    <p class="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">Отряды</p>
    <h2 class="font-genshin mb-4 text-2xl tracking-wide text-foreground">Примеры команд</h2>

    <div class="mb-5 overflow-hidden rounded-[20px] border border-black/[0.05] bg-white/80 p-4 shadow-soft sm:p-5">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 class="font-display text-lg font-bold text-foreground">Премиум-отряд</h3>
        <span class="rounded-full bg-[#189b8e]/12 px-3 py-1 text-xs font-bold text-[#189b8e]">Топ</span>
      </div>
      <div class="flex flex-wrap gap-3">
        <div class="w-[100px] overflow-hidden rounded-[14px] bg-card ring-1 ring-black/[0.06]">
          <div class="relative h-[100px] bg-cover bg-center" style="background-image:url(/images/legend-bg.jpg)">
            <img src="/images/mini-characters/Furina.webp" alt="Фурина" class="h-full w-full object-cover" />
            <img src="/images/default-elements/Hydro.svg" alt="" class="absolute left-1 top-1 h-5 w-5 drop-shadow" />
          </div>
          <p class="font-genshin px-1 py-1.5 text-center text-[11px] text-foreground">Фурина</p>
        </div>
        <div class="w-[100px] overflow-hidden rounded-[14px] bg-card ring-1 ring-black/[0.06]">
          <div class="relative h-[100px] bg-cover bg-center" style="background-image:url(/images/legend-bg.jpg)">
            <img src="/images/mini-characters/neuvillette.webp" alt="Нёвиллет" class="h-full w-full object-cover" />
            <img src="/images/default-elements/Hydro.svg" alt="" class="absolute left-1 top-1 h-5 w-5 drop-shadow" />
          </div>
          <p class="font-genshin px-1 py-1.5 text-center text-[11px] text-foreground">Нёвиллет</p>
        </div>
        <div class="w-[100px] overflow-hidden rounded-[14px] bg-card ring-1 ring-black/[0.06]">
          <div class="relative h-[100px] bg-cover bg-center" style="background-image:url(/images/legend-bg.jpg)">
            <img src="/images/mini-characters/kazuha.webp" alt="Кадзуха" class="h-full w-full object-cover" />
            <img src="/images/default-elements/Anemo.svg" alt="" class="absolute left-1 top-1 h-5 w-5 drop-shadow" />
          </div>
          <p class="font-genshin px-1 py-1.5 text-center text-[11px] text-foreground">Кадзуха</p>
        </div>
        <div class="w-[100px] overflow-hidden rounded-[14px] bg-card ring-1 ring-black/[0.06]">
          <div class="relative h-[100px] bg-cover bg-center" style="background-image:url(/images/epic-bg.jpg)">
            <img src="/images/mini-characters/bennett.webp" alt="Беннет" class="h-full w-full object-cover" />
            <img src="/images/default-elements/Pyro.svg" alt="" class="absolute left-1 top-1 h-5 w-5 drop-shadow" />
          </div>
          <p class="font-genshin px-1 py-1.5 text-center text-[11px] text-foreground">Беннет</p>
        </div>
      </div>
      <p class="mt-3 text-sm font-medium text-muted-foreground">
        Ротация: ульта саппортов → баффы → ульта DPS → нормалки / скилл.
      </p>
    </div>

    <div class="overflow-hidden rounded-[20px] border border-black/[0.05] bg-white/80 p-4 shadow-soft sm:p-5">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 class="font-display text-lg font-bold text-foreground">Бюджетный отряд</h3>
        <span class="rounded-full bg-navy/[0.06] px-3 py-1 text-xs font-bold text-navy/70">F2P</span>
      </div>
      <div class="flex flex-wrap gap-3">
        <div class="w-[100px] overflow-hidden rounded-[14px] bg-card ring-1 ring-black/[0.06]">
          <div class="relative h-[100px] bg-cover bg-center" style="background-image:url(/images/legend-bg.jpg)">
            <img src="/images/mini-characters/Furina.webp" alt="Фурина" class="h-full w-full object-cover" />
          </div>
          <p class="font-genshin px-1 py-1.5 text-center text-[11px] text-foreground">Фурина</p>
        </div>
        <div class="w-[100px] overflow-hidden rounded-[14px] bg-card ring-1 ring-black/[0.06]">
          <div class="relative h-[100px] bg-cover bg-center" style="background-image:url(/images/epic-bg.jpg)">
            <img src="/images/mini-characters/xingqiu.webp" alt="Син Цю" class="h-full w-full object-cover" />
          </div>
          <p class="font-genshin px-1 py-1.5 text-center text-[11px] text-foreground">Син Цю</p>
        </div>
        <div class="w-[100px] overflow-hidden rounded-[14px] bg-card ring-1 ring-black/[0.06]">
          <div class="relative h-[100px] bg-cover bg-center" style="background-image:url(/images/epic-bg.jpg)">
            <img src="/images/mini-characters/sucrose.webp" alt="Сахароза" class="h-full w-full object-cover" />
          </div>
          <p class="font-genshin px-1 py-1.5 text-center text-[11px] text-foreground">Сахароза</p>
        </div>
        <div class="w-[100px] overflow-hidden rounded-[14px] bg-card ring-1 ring-black/[0.06]">
          <div class="relative h-[100px] bg-cover bg-center" style="background-image:url(/images/epic-bg.jpg)">
            <img src="/images/mini-characters/bennett.webp" alt="Беннет" class="h-full w-full object-cover" />
          </div>
          <p class="font-genshin px-1 py-1.5 text-center text-[11px] text-foreground">Беннет</p>
        </div>
      </div>
    </div>
  </div>

  <div>
    <p class="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">Таланты</p>
    <h2 class="font-genshin mb-3 text-2xl tracking-wide text-foreground">Приоритет прокачки</h2>
    <ol class="list-decimal space-y-2 pl-5 text-base font-medium text-muted-foreground">
      <li><span class="text-foreground font-bold">Ульта</span> — главный источник урона / баффа</li>
      <li><span class="text-foreground font-bold">Скилл</span> — апплай и доп. урон</li>
      <li><span class="text-foreground font-bold">Атаки</span> — по необходимости</li>
    </ol>
  </div>
</section>`;
}

export const GUIDE_SNIPPETS = {
  weaponCard: `<!-- Карточка оружия -->
<div class="w-[122px] overflow-hidden rounded-[18px] bg-card shadow-panel ring-1 ring-black/[0.06]">
  <div class="relative h-[122px] bg-cover bg-center" style="background-image:url(/images/legend-bg.jpg)">
    <img src="/images/mini-artifacts/Zolotaya-truppa.webp" alt="Оружие" class="h-full w-full object-cover" />
    <div class="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent"></div>
    <img src="/images/stars/Quality_star_5.svg" alt="" class="absolute bottom-1.5 left-1/2 h-4 w-auto -translate-x-1/2" />
  </div>
  <p class="font-genshin px-1.5 py-2.5 text-center text-[13px] leading-tight text-foreground">Название</p>
</div>`,

  teamMember: `<!-- Слот в отряде -->
<div class="w-[100px] overflow-hidden rounded-[14px] bg-card ring-1 ring-black/[0.06]">
  <div class="relative h-[100px] bg-cover bg-center" style="background-image:url(/images/legend-bg.jpg)">
    <img src="/images/mini-characters/Furina.webp" alt="Имя" class="h-full w-full object-cover" />
    <img src="/images/default-elements/Hydro.svg" alt="" class="absolute left-1 top-1 h-5 w-5 drop-shadow" />
  </div>
  <p class="font-genshin px-1 py-1.5 text-center text-[11px] text-foreground">Имя</p>
</div>`,

  section: `<!-- Секция -->
<div>
  <p class="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">Подзаголовок</p>
  <h2 class="font-genshin mb-3 text-2xl tracking-wide text-foreground">Заголовок</h2>
  <p class="text-base font-medium leading-relaxed text-muted-foreground">Текст секции…</p>
</div>`,
} as const;
