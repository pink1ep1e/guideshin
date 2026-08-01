const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

async function makeFavicon() {
  const logo = fs.readFileSync("public/logo-white.svg", "utf8");
  const inner = logo
    .replace(/<\?xml[^>]*>/, "")
    .replace(/<svg[^>]*>/, "")
    .replace("</svg>", "");
  const composed = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#189b8e"/>
  <g transform="translate(48 36) scale(0.42)">${inner}</g>
</svg>`);
  await sharp(composed).resize(180, 180).png().toFile("app/apple-icon.png");
  await sharp(composed).resize(32, 32).png().toFile("public/favicon-32.png");
  fs.writeFileSync("app/icon.svg", composed);
  console.log("favicon ok");
}

async function compressDir(dir, maxW) {
  const files = fs.readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f));
  let saved = 0;
  for (const f of files) {
    const src = path.join(dir, f);
    const before = fs.statSync(src).size;
    const base = f.replace(/\.[^.]+$/, "");
    const out = path.join(dir, base + ".webp");
    await sharp(src)
      .resize({
        width: maxW,
        height: maxW,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 78, effort: 4 })
      .toFile(out);
    const after = fs.statSync(out).size;
    saved += Math.max(0, before - after);
    console.log(
      `${f} ${(before / 1e6).toFixed(1)}MB -> ${base}.webp ${(after / 1e6).toFixed(2)}MB`,
    );
  }
  console.log(`saved ~${(saved / 1e6).toFixed(1)}MB in ${dir}`);
}

(async () => {
  await makeFavicon();
  await compressDir("public/images/home/chars", 1400);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
