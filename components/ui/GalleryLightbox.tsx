"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryPhotoContent } from "@/lib/content-types";

type GalleryLightboxProps = {
  images: GalleryPhotoContent[];
  index: number | null; // aktuální otevřená fotka, null = zavřeno
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export default function GalleryLightbox({ images, index, onClose, onNavigate }: GalleryLightboxProps) {
  const touchStartX = useRef<number | null>(null);
  const isOpen = index !== null;

  const goPrev = () => index !== null && onNavigate((index - 1 + images.length) % images.length);
  const goNext = () => index !== null && onNavigate((index + 1) % images.length);

  // Klávesnice + zamčení scrollu pozadí
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, index, images.length]);

  const current = index !== null ? images[index] : null;

  return (
    <AnimatePresence>
      {isOpen && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md"
          onClick={onClose}
          onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (dx > 50) goPrev();
            else if (dx < -50) goNext();
            touchStartX.current = null;
          }}
        >
          {/* Zavřít */}
          <button
            aria-label="Zavřít"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2.5 text-white backdrop-blur transition hover:bg-[#D90000] hover:scale-105"
          >
            <X size={24} />
          </button>

          {/* Počítadlo */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 font-orbitron text-sm tracking-widest text-white/80">
            {index + 1} / {images.length}
          </div>

          {/* Předchozí */}
          <button
            aria-label="Předchozí"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-2 sm:left-6 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-[#D90000] hover:scale-105"
          >
            <ChevronLeft size={32} />
          </button>

          {/* Fotka */}
          <motion.div
            key={current.src}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="relative flex max-h-[88vh] max-w-[92vw] items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={current.src}
              alt={`Fotka kapely ${index + 1}`}
              width={current.width}
              height={current.height}
              className="max-h-[88vh] w-auto rounded-lg object-contain shadow-2xl"
              sizes="92vw"
              priority
            />
          </motion.div>

          {/* Další */}
          <button
            aria-label="Další"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-2 sm:right-6 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-[#D90000] hover:scale-105"
          >
            <ChevronRight size={32} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
