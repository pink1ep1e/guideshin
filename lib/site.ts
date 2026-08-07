export const SITE_NAME = "Guideshin";
export const SITE_DOMAIN = "guideshin.ru";
export const SITE_URL = "https://guideshin.ru";
export const SITE_TELEGRAM = "https://t.me/guideshin";

/** PNK VPN — промо в сайдбаре */
export const PNK_VPN_BOT = "https://t.me/pnkvpn_bot";
/** Тестовая ссылка Boosty */
export const PNK_VPN_BOOSTY = "https://boosty.to/pnk";
export const PNK_VPN_LOGO = "/images/pnk-vpn-logo.svg";

export const SITE_DESCRIPTION =
  "Гайды по Genshin Impact: билды персонажей, оружие, артефакты, материалы и карта Тейвата.";

export const SITE_KEYWORDS = [
  "Genshin Impact",
  "гайды Genshin",
  "билды персонажей",
  "артефакты",
  "оружие",
  "материалы",
  "Guideshin",
  "guideshin.ru",
];

export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
