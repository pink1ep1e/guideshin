export const SITE_NAME = "Guideshin";
export const SITE_DOMAIN = "guideshin.ru";
export const SITE_URL = "https://guideshin.ru";
export const SITE_TELEGRAM = "https://t.me/guideshin";

/** PNK VPN — промо в сайдбаре */
export const PNK_VPN_BOT = "https://t.me/pnkvpn_bot?start=guideshin";
export const PNK_VPN_LOGO = "/images/pnk-vpn-logo.svg";
export const PNK_VPN_BG = "/images/pnk-vpn-bg.png";

export const SITE_DESCRIPTION =
  "Гайды на персонажей Genshin Impact: лучшие билды, оружие, артефакты, таланты и материалы прокачки. Актуальные гайды на Guideshin.";

export const SITE_TITLE_DEFAULT =
  "Guideshin — гайды на персонажей Genshin Impact";

export const SITE_KEYWORDS = [
  "Genshin Impact",
  "гайды Genshin",
  "гайд на персонажа",
  "билды персонажей",
  "билд",
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
