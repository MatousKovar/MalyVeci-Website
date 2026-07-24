"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, X } from "lucide-react";

type ReelsModalProps = {
  ids: string[];
  index: number | null; // index otevřeného reelu, null = zavřeno
  onClose: () => void;
};

export default function ReelsModal({ ids, index, onClose }: ReelsModalProps) {
  const isOpen = index !== null;
  const containerRef = useRef<HTMLDivElement>(null);
  const reelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  // Po otevření odscrollovat na zvolený reel a nastavit ho jako aktivní.
  useEffect(() => {
    if (!isOpen || index === null) return;
    setActive(index);
    // počkat na vykreslení, pak skočit na daný reel bez animace
    const id = requestAnimationFrame(() => {
      reelRefs.current[index]?.scrollIntoView({ block: "center" });
    });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, index]);

  // Sledovat, který reel je uprostřed → ten se přehrává.
  useEffect(() => {
    if (!isOpen) return;
    const root = containerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const i = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(i)) setActive(i);
          }
        });
      },
      { root, threshold: [0.6] }
    );
    reelRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [isOpen]);

  const go = (dir: number) => {
    const next = Math.min(Math.max(active + dir, 0), ids.length - 1);
    reelRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Klávesnice: šipky nahoru/dolů mezi reely, Esc zavře.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, active, ids.length]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-sm"
        >
          {/* Zavřít */}
          <button
            aria-label="Zavřít"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 rounded-full bg-white/10 p-2.5 text-white backdrop-blur transition hover:bg-[#D90000] hover:scale-105"
          >
            <X size={24} />
          </button>

          {/* Počítadlo */}
          <div className="absolute top-6 left-1/2 z-20 -translate-x-1/2 font-orbitron text-sm tracking-widest text-white/80">
            {active + 1} / {ids.length}
          </div>

          {/* Navigace nahoru/dolů (desktop) */}
          <div className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 md:flex">
            <button
              aria-label="Předchozí"
              onClick={() => go(-1)}
              disabled={active === 0}
              className="rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-[#D90000] disabled:opacity-30 disabled:hover:bg-white/10"
            >
              <ChevronUp size={28} />
            </button>
            <button
              aria-label="Další"
              onClick={() => go(1)}
              disabled={active === ids.length - 1}
              className="rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-[#D90000] disabled:opacity-30 disabled:hover:bg-white/10"
            >
              <ChevronDown size={28} />
            </button>
          </div>

          {/* Vertikální feed se snapem – scroll = další reel */}
          <div
            ref={containerRef}
            className="h-full snap-y snap-mandatory overflow-y-auto no-scrollbar"
          >
            {ids.map((id, i) => (
              <div
                key={`${id}-${i}`}
                data-index={i}
                ref={(el) => { reelRefs.current[i] = el; }}
                className="flex h-full w-full snap-center items-center justify-center px-4"
              >
                <div className="relative aspect-[9/16] h-[88vh] max-h-[88vh] max-w-[95vw] overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
                  {active === i ? (
                    <iframe
                      key={`iframe-${id}-${active}`}
                      className="h-full w-full"
                      src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                      title="YouTube Short"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  ) : (
                    // Neaktivní reel = jen náhled (šetří výkon, zastaví přehrávání)
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://i.ytimg.com/vi/${id}/hq720.jpg`}
                      alt=""
                      loading="lazy"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.src.endsWith("hqdefault.jpg")) img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
                      }}
                      className="h-full w-full object-cover opacity-60"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
