import Link from "next/link";
import { TelegramLink } from "@/components/TelegramLink";
import { SITE_NAME } from "@/lib/site";

const footerLinks = [
  { href: "/wiki/characters", label: "Персонажи" },
  { href: "/wiki/artifacts", label: "Артефакты" },
  { href: "/wiki/weapons", label: "Оружие" },
  { href: "/wiki/materials", label: "Материалы" },
  { href: "/wiki/regions", label: "Регионы" },
  { href: "/map", label: "Карта" },
];

export default function Footer() {
  return (
    <footer className="mt-6">
      <div className="container-page py-12">
        <div className="glass-panel grid gap-8 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="mb-3 font-genshin text-xl tracking-wide text-foreground">
              {SITE_NAME}
            </p>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Гайды по Genshin Impact: билды, артефакты, материалы и советы для
              комфортного прогресса.
            </p>
            <TelegramLink
              placement="footer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#189b8e]/10 px-3.5 py-2.5 text-sm font-bold text-[#189b8e] transition hover:bg-[#189b8e] hover:text-white"
            />
          </div>
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-wider text-[#189b8e]">
              Разделы
            </p>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-foreground/85 transition hover:text-[#189b8e]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-wider text-[#189b8e]">
              Сообщество
            </p>
            <ul className="space-y-2">
              <li>
                <TelegramLink
                  placement="footer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground/85 transition hover:text-[#189b8e]"
                />
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-5 text-sm text-muted-foreground">
          <p>
            Copyright © {SITE_NAME}, {new Date().getFullYear()}. Не
            является аффилированным и не связан с компанией HoYoverse.
          </p>
          <p className="mt-1">Копирование сайта запрещено.</p>
        </div>
      </div>
    </footer>
  );
}
