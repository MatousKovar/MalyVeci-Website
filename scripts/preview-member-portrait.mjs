import sharp from "sharp";
import { fileURLToPath } from "node:url";

const zoom = Number(process.argv[2] ?? 1.12);
if (!Number.isFinite(zoom) || zoom < 1 || zoom > 1.5) {
  throw new Error("Zadej přiblížení mezi 1 a 1.5, například 1.18.");
}

const input = fileURLToPath(new URL("../public/matous.jpeg", import.meta.url));
const output = fileURLToPath(new URL("../public/matous-preview.jpeg", import.meta.url));
const { data, info } = await sharp(input).autoOrient().toBuffer({ resolveWithObject: true });
const cropWidth = Math.round(info.width / zoom / 2) * 2;
const cropHeight = Math.round(cropWidth * info.height / info.width);

await sharp(data)
  .extract({
    left: info.width - cropWidth,
    top: info.height - cropHeight,
    width: cropWidth,
    height: cropHeight,
  })
  .resize(info.width, info.height)
  .jpeg({ quality: 94, mozjpeg: true })
  .toFile(output);

console.log(`Vytvořeno public/matous-preview.jpeg, přiblížení ${zoom}× od pravého spodního rohu.`);
