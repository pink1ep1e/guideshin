export const SITE_NAME = "Guideshin";
export const SITE_DOMAIN = "guideshin.ru";
export const SITE_URL = "https://guideshin.ru";
export const SITE_TELEGRAM = "https://t.me/guideshin";

/** PNK VPN — промо в сайдбаре */
export const PNK_VPN_BOT = "https://t.me/pnkvpn_bot";
/** Тестовая ссылка Boosty */
export const PNK_VPN_BOOSTY = "https://boosty.to/pnk";
export const PNK_VPN_LOGO = "/images/pnk-vpn-logo.svg";
export const PNK_VPN_BG = "/images/pnk-vpn-bg.png";

export const SITE_DESCRIPTION =
  "Гайды по Genshin Impact: билды персонажей, оружие, артефакты, материалы. Нод-Край и подготовка к Снежной — актуальные гайды на Guideshin.";

export const SITE_TITLE_DEFAULT =
  "Guideshin — гайды Genshin Impact: билды и прокачка";

export const SITE_KEYWORDS = [
  "Genshin Impact",
  "гайды Genshin",
  "билды персонажей",
  "гайд на персонажа",
  "билд",
  "артефакты",
  "оружие",
  "материалы",
  "Нод-Край",
  "Снежная",
  "Guideshin",
  "guideshin.ru",
];

export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
