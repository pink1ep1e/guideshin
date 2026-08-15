import {
  formatWishTimeApi,
  type NormalizedWish,
} from "@/lib/wishes";

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
      const time = formatWishTimeApi(p.wishTime);
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
