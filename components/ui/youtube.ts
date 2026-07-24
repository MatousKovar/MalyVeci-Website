import type { SyntheticEvent } from "react";

/** Z libovolného tvaru YouTube odkazu (shorts/watch/youtu.be/embed) nebo holého ID vytáhne ID videa. */
export function getYouTubeId(input: string): string {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s; // už je to samotné ID
  const m = s.match(/(?:shorts\/|watch\?v=|youtu\.be\/|embed\/|\/v\/)([\w-]{11})/);
  return m ? m[1] : s;
}

// Pořadí náhledů od nejlepšího: oardefault = svislý HD snímek shortu (720×1280),
// maxresdefault = HD na šířku, hqdefault = vždy existuje jako záchrana.
const THUMB_ORDER = ["oardefault.jpg", "maxresdefault.jpg", "hqdefault.jpg"];

/** Nejlepší dostupný náhled (svislý HD pro shorts). */
export function ytThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/${THUMB_ORDER[0]}`;
}

/** Když daný náhled neexistuje (404), postupně spadne na nižší kvalitu. */
export function handleThumbError(e: SyntheticEvent<HTMLImageElement>, id: string): void {
  const img = e.currentTarget;
  const cur = THUMB_ORDER.findIndex((o) => img.src.endsWith(o));
  if (cur >= 0 && cur < THUMB_ORDER.length - 1) {
    img.src = `https://i.ytimg.com/vi/${id}/${THUMB_ORDER[cur + 1]}`;
  }
}
