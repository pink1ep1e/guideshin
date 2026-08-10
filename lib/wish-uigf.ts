import type { NormalizedWish } from "@/lib/wishes";

/** UIGF v3-совместимый экспорт для обмена с paimon.moe и др. */
export function buildUigfExport(input: {
  uid?: string | null;
  accountLabel: string;
  pulls: {
    hoyoId: string;
    gachaType: string;
    itemName: string;
    itemType: string;
    rankType: string;
    wishTime: Date | string;
  }[];
}) {
  const list = input.pulls
    .slice()
    .sort(
      (a, b) =>
        new Date(a.wishTime).getTime() - new Date(b.wishTime).getTime(),
    )
    .map((p) => {
      const t = new Date(p.wishTime);
      // Asia/Shanghai как в клиенте игры
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).formatToParts(t);
      const get = (type: string) =>
        parts.find((x) => x.type === type)?.value || "00";
      const time = `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
      return {
        gacha_type: p.gachaType,
        uigf_gacha_type: p.gachaType === "400" ? "301" : p.gachaType,
        item_id: "",
        count: "1",
        time,
        name: p.itemName,
        item_type: /weapon|оруж/i.test(p.itemType) ? "Weapon" : "Character",
        rank_type: String(p.rankType),
        id: p.hoyoId,
      };
    });

  return {
    info: {
      uid: input.uid || "0",
      lang: "ru-ru",
      export_timestamp: Math.floor(Date.now() / 1000),
      export_app: "Guideshin",
      export_app_version: "0.2.0",
      uigf_version: "v3.0",
      export_region: "",
      account_label: input.accountLabel,
    },
    list,
  };
}

export type UigfPayload = ReturnType<typeof buildUigfExport>;

export function normalizedToUigfPulls(pulls: NormalizedWish[]) {
  return pulls.map((p) => ({
    hoyoId: p.hoyoId,
    gachaType: p.gachaType,
    itemName: p.itemName,
    itemType: p.itemType,
    rankType: p.rankType,
    wishTime: p.wishTime,
  }));
}
