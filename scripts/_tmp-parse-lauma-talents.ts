import fs from "fs";

const t = fs.readFileSync(
  "C:/Users/pnk/.cursor/projects/c-Users-pnk-Documents-genshin-guide/agent-tools/7ccfe0e0-d7b7-4c16-9a7e-341395709033.txt",
  "utf8",
);
const lines = t.split(/\n/);
const out: string[] = [];
for (const i of [242, 249, 256]) {
  out.push(`=== LINE ${i + 1} len ${lines[i]?.length}`);
  const line = lines[i] || "";
  // Split by | and dump labels with first 13 values
  const parts = line.split("|").map((s) => s.trim()).filter(Boolean);
  out.push(`parts: ${parts.length}`);
  // The format seems: Lv1..Lv15 header then label value*15 pairs
  // Actually looking at the content: "| Lv1 | Lv2 | ... | Lv15 | 1-Hit DMG | 33.7% | 36.23% | ..."
  // So it's header then repeating (label + 15 values)
  const headerEnd = parts.findIndex((p) => p === "Lv15");
  out.push(`headerEnd idx ${headerEnd}`);
  let rest = parts.slice(headerEnd + 1);
  while (rest.length) {
    const label = rest[0];
    const vals = rest.slice(1, 14); // L1-13
    out.push(`${label}: ${vals.join(", ")}`);
    rest = rest.slice(16); // label + 15 values
  }
  out.push("---");
}
fs.writeFileSync("scripts/_tmp-lauma-talents-parsed.txt", out.join("\n"));
console.log("wrote", out.length, "lines");

const j = JSON.parse(
  fs.readFileSync(
    "C:/Users/pnk/.cursor/projects/c-Users-pnk-Documents-genshin-guide/agent-tools/c504dd8e-687e-4393-870b-cf0757973e92.txt",
    "utf8",
  ),
);
const d = j.data;
const talentOut: string[] = [];
for (const [k, tAny] of Object.entries(d.talent || {})) {
  const talent = tAny as {
    name: string;
    type?: string;
    promote?: Record<string, { description?: string; params?: number[] }>;
  };
  talentOut.push(`\n## ${k} ${talent.name}`);
  if (!talent.promote) continue;
  const levels = Object.keys(talent.promote).sort((a, b) => Number(a) - Number(b));
  for (const lv of levels.slice(0, 3)) {
    const p = talent.promote[lv];
    talentOut.push(`L${lv} params: ${JSON.stringify(p.params)}`);
  }
  const p13 = talent.promote["13"] || talent.promote[13 as unknown as string];
  if (p13) talentOut.push(`L13 params: ${JSON.stringify(p13.params)}`);
  const p1 = talent.promote["1"];
  if (p1?.description) talentOut.push(`desc: ${String(p1.description).slice(0, 400)}`);
}
fs.writeFileSync("scripts/_tmp-lauma-yatta.txt", talentOut.join("\n"));
console.log("yatta written");
