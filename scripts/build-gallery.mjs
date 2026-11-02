import { createHash } from "node:crypto";
import { readdir, readFile, rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { validateGalleryPhotos } from "../src/lib/content-validation.mjs";

const directory = new URL("../public/gallery/", import.meta.url);
const manifest = new URL("../src/content/gallery.json", import.meta.url);
const original = await readFile(manifest, "utf8");
const previous = validateGalleryPhotos(JSON.parse(original));
if (previous.errors.length) throw new Error(previous.errors.join("\n"));

const existing = new Map(previous.items.map((photo) => [photo.src, photo]));
const files = (await readdir(directory, { withFileTypes: true }))
  .filter((file) => file.isFile() && /\.(jpe?g|png|webp|avif)$/i.test(file.name))
  .map((file) => file.name)
  .sort((first, second) => {
    const firstOrder = existing.get(`/gallery/${first}`)?.order ?? Infinity;
    const secondOrder = existing.get(`/gallery/${second}`)?.order ?? Infinity;
    return firstOrder - secondOrder || first.localeCompare(second, "cs", { numeric: true });
  });

let nextId = Math.max(0, ...previous.items.map((photo) =>
  Number(photo.id.match(/^gallery-photo-(\d+)$/)?.[1] ?? 0))) + 1;
const seen = new Set();
const photos = [];
let duplicates = 0;

for (const filename of files) {
  const src = `/gallery/${filename}`;
  const data = await readFile(fileURLToPath(directory) + filename);
  const hash = createHash("sha256").update(data).digest("hex");
  if (seen.has(hash)) {
    duplicates += 1;
    continue;
  }
  seen.add(hash);

  const metadata = await sharp(data).metadata();
  const swapped = [5, 6, 7, 8].includes(metadata.orientation);
  photos.push({
    id: existing.get(src)?.id ?? `gallery-photo-${String(nextId++).padStart(3, "0")}`,
    src,
    order: photos.length,
    width: swapped ? metadata.height : metadata.width,
    height: swapped ? metadata.width : metadata.height,
  });
}

const result = validateGalleryPhotos(photos);
if (result.errors.length) throw new Error(result.errors.join("\n"));
const content = JSON.stringify(result.items, null, 2) + "\n";
if (content !== original) {
  const temporary = new URL(`../src/content/gallery.${process.pid}.tmp`, import.meta.url);
  await writeFile(temporary, content);
  await rename(temporary, manifest);
}

const currentPaths = new Set(result.items.map((photo) => photo.src));
const added = result.items.filter((photo) => !existing.has(photo.src)).length;
const removed = previous.items.filter((photo) => !currentPaths.has(photo.src)).length;
console.log(`Galerie: ${photos.length} fotek, přidáno ${added}, odebráno ${removed}, přeskočeno kopií ${duplicates}.`);
