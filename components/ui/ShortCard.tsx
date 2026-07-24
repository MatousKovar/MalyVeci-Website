"use client";

import { Play } from "lucide-react";

/** Z libovolného tvaru YouTube odkazu (shorts/watch/youtu.be/embed) nebo holého ID vytáhne ID videa. */
export function getYouTubeId(input: string): string {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s; // už je to samotné ID
  const m = s.match(/(?:shorts\/|watch\?v=|youtu\.be\/|embed\/|\/v\/)([\w-]{11})/);
  return m ? m[1] : s;
}

export default function ShortCard({ id, onOpen }: { id: string; onOpen: () => void }) {
  return (
    <div className="relative aspect-[9/16] w-[210px] shrink-0 snap-center overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-white/10 sm:w-[240px]">
      <button
        type="button"
        onClick={onOpen}
        aria-label="Přehrát short"
        className="group block h-full w-full"
      >
          {/* Náhled – hq720 pro shorts, při chybě spadne na hqdefault */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${id}/hq720.jpg`}
            alt=""
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.src.endsWith("hqdefault.jpg")) img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
            }}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          {/* Ztmavení a tlačítko play */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
        <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#D90000]/90 text-white shadow-lg transition duration-300 group-hover:scale-110 group-hover:bg-[#D90000]">
          <Play size={26} className="ml-0.5 fill-current" />
        </span>
      </button>
    </div>
  );
}
