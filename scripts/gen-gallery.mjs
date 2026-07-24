// Auto-generuje seznam fotek do galerie ze složky public/gallery.
// Spouští se přes `npm run gallery` a automaticky před buildem (prebuild).
// Ke každé fotce zjistí rozměry (kvůli orientaci a plynulému načítání bez poskakování).
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";

const GALLERY_DIR = join(process.cwd(), "public", "gallery");
const OUT_FILE = join(process.cwd(), "src", "lib", "gallery-images.ts");
const EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

/** Přečte šířku/výšku z hlavičky obrázku (PNG/JPEG/GIF/WebP), bez závislostí. */
function imageSize(buf) {
  // PNG
  if (buf.length >= 24 && buf.toString("ascii", 1, 4) === "PNG") {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // GIF
  if (buf.length >= 10 && buf.toString("ascii", 0, 3) === "GIF") {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }
  // WebP
  if (buf.length >= 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const fmt = buf.toString("ascii", 12, 16);
    if (fmt === "VP8 ") {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    if (fmt === "VP8L") {
      const b = buf.readUInt32LE(21);
      return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
    if (fmt === "VP8X") {
      const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
      const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
      return { width, height };
    }
  }
  // JPEG – projdeme markery a najdeme SOF (Start Of Frame)
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let off = 2;
    while (off < buf.length) {
      if (buf[off] !== 0xff) { off++; continue; }
      const marker = buf[off + 1];
      // SOF0..SOF15 (kromě DHT/DAC/RST/SOI/EOI) nesou rozměry
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buf.readUInt16BE(off + 5), width: buf.readUInt16BE(off + 7) };
      }
      const len = buf.readUInt16BE(off + 2);
      off += 2 + len;
    }
  }
  return null;
}

let files = [];
try {
  files = readdirSync(GALLERY_DIR);
} catch {
  console.warn("[gallery] Složka public/gallery neexistuje – generuji prázdný seznam.");
}

const images = files
  .filter((f) => !f.startsWith(".") && EXTS.has(extname(f).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, "cs", { numeric: true }))
  .map((file) => {
    const buf = readFileSync(join(GALLERY_DIR, file));
    const size = imageSize(buf) ?? { width: 1600, height: 1200 };
    return { src: `/gallery/${file}`, width: size.width, height: size.height };
  });

const banner = "// TENTO SOUBOR JE AUTOMATICKY GENEROVANÝ – needituj ho ručně.\n// Vygeneruje ho `npm run gallery` ze složky public/gallery.\n";
const body = `${banner}export type GalleryImage = { src: string; width: number; height: number };\n\nexport const galleryImages: GalleryImage[] = ${JSON.stringify(images, null, 2)};\n`;

writeFileSync(OUT_FILE, body);
console.log(`[gallery] Zapsáno ${images.length} fotek do src/lib/gallery-images.ts`);
