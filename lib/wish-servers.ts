/** Иконки серверов Genshin (для FancySelect). */
export const WISH_SERVER_OPTIONS = [
  {
    value: "europe",
    label: "Европа",
    icon: "/images/servers/europe.svg",
  },
  {
    value: "asia",
    label: "Азия",
    icon: "/images/servers/asia.svg",
  },
  {
    value: "america",
    label: "Америка",
    icon: "/images/servers/america.svg",
  },
  {
    value: "china",
    label: "Китай",
    icon: "/images/servers/china.svg",
  },
] as const;

export const SERVER_LABEL: Record<string, string> = {
  europe: "Европа",
  asia: "Азия",
  america: "Америка",
  china: "Китай",
};
