"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { handleThumbError, ytThumb } from "./youtube";

type ShortsCarouselProps = {
  ids: string[];
  onOpen: (index: number) => void;
  initialIndex?: number;
};

export default function ShortsCarousel({ ids, onOpen, initialIndex = 0 }: ShortsCarouselProps) {
  const n = ids.length;
  const [active, setActive] = useState(initialIndex);
  const dragX = useRef<number | null>(null);

  useEffect(() => {
    setActive(Math.min(Math.max(initialIndex, 0), Math.max(n - 1, 0)));
  }, [initialIndex, n]);

  const rotate = (dir: number) => setActive((a) => (a + dir + n) % n);

  // Nejkratší kruhová vzdálenost položky od středu (…-1 vlevo, 0 střed, +1 vpravo…).
  const deltaOf = (i: number) => {
    let d = i - active;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };

  // Umístění podle slotu: střed vepředu, sousedi vzadu po stranách, zbytek schovaný.
  const styleFor = (d: number): React.CSSProperties => {
    if (d === 0) return { transform: "translateX(0) scale(1)", zIndex: 30, opacity: 1 };
    if (d === -1) return { transform: "translateX(-62%) scale(0.8)", zIndex: 20, opacity: 0.5 };
    if (d === 1) return { transform: "translateX(62%) scale(0.8)", zIndex: 20, opacity: 0.5 };
    return {
      transform: `translateX(${d < 0 ? "-" : ""}95%) scale(0.6)`,
      zIndex: 10,
      opacity: 0,
      pointerEvents: "none",
    };
  };

  return (
    <div className="relative w-full max-w-4xl select-none">
      {/* Šipky */}
      {n > 1 && (
        <>
          <button
            aria-label="Předchozí"
            onClick={() => rotate(-1)}
            className="absolute left-2 top-1/2 z-40 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur transition hover:bg-[#D90000] sm:left-6"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            aria-label="Další"
            onClick={() => rotate(1)}
            className="absolute right-2 top-1/2 z-40 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur transition hover:bg-[#D90000] sm:right-6"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* Scéna coverflow */}
      <div
        className="relative mx-auto h-[420px] w-full overflow-hidden sm:h-[480px]"
        onPointerDown={(e) => (dragX.current = e.clientX)}
        onPointerUp={(e) => {
          if (dragX.current === null) return;
          const dx = e.clientX - dragX.current;
          if (dx > 40) rotate(-1);
          else if (dx < -40) rotate(1);
          dragX.current = null;
        }}
      >
        {ids.map((id, i) => {
          const d = deltaOf(i);
          const isCenter = d === 0;
          return (
            <button
              key={`${id}-${i}`}
              type="button"
              onClick={() => (isCenter ? onOpen(i) : setActive(i))}
              aria-label={isCenter ? "Přehrát short" : "Přejít na tento short"}
              style={styleFor(d)}
              className="group absolute inset-0 m-auto aspect-[9/16] h-[400px] overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10 transition-all duration-500 ease-out sm:h-[460px]"
            >
              {/* Svislý HD náhled shortu */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ytThumb(id)}
                alt=""
                loading="lazy"
                onError={(e) => handleThumbError(e, id)}
                className="h-full w-full object-cover"
                draggable={false}
              />
              {/* Ztmavení bočních (vzadu) + spodní gradient pod play */}
              <div
                className={`pointer-events-none absolute inset-0 transition-colors duration-500 ${
                  isCenter ? "bg-gradient-to-t from-black/40 via-transparent to-transparent" : "bg-black/30"
                }`}
              />
              {/* Play jen na středu */}
              {isCenter && (
                <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#D90000]/90 text-white shadow-lg transition duration-300 group-hover:scale-110 group-hover:bg-[#D90000]">
                  <Play size={30} className="ml-0.5 fill-current" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
