"use client";

import { useState } from "react";
import Image from "next/image";
import galleryPhotos from "@/content/gallery.json";
import { validateGalleryPhotos } from "@/lib/content-validation.mjs";
import GalleryLightbox from "@/../components/ui/GalleryLightbox";

const galleryContent = validateGalleryPhotos(galleryPhotos);
const galleryImages = [...galleryContent.items].sort(
  (first, second) => first.order - second.order,
);

export default function GallerySection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Pás zdvojíme, aby se posouval nekonečně bez švu.
  const track = [...galleryImages, ...galleryImages];
  // Rychlost podle počtu fotek (delší pás = pomalejší, ať to není zběsilé).
  const duration = `${Math.max(galleryImages.length * 5, 20)}s`;

  return (
    <section id="Fotogalerie" className="py-20 text-white">
      <h2 className="text-5xl text-stroke-2 brightness-85 font-bold font-orbitron text-center mb-12 sm:text-6xl md:text-7xl md:text-stroke-4 lg:text-8xl">
        <span className="text-black">FO</span>
        <span className="text-[#D90000]">TOGRAFIE</span>
      </h2>

      {galleryContent.errors.length > 0 && (
        <p role="alert" className="mx-auto mb-6 max-w-3xl px-5 text-center text-sm text-amber-200">
          Některé fotky galerie se nepodařilo načíst. {galleryContent.errors.join(" ")}
        </p>
      )}

      {galleryImages.length === 0 ? (
        <p className="text-center text-white/50">
          Zatím tu nejsou žádné fotky – nahraj je do složky <code>public/gallery</code>.
        </p>
      ) : (
        <div
          className="group relative overflow-hidden"
          // Jemné rozplynutí na krajích pásu
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
            maskImage:
              "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          }}
        >
          <div
            className="flex w-max gap-4 py-4 animate-scroll hover:[animation-play-state:paused]"
            style={{ animationDuration: duration }}
          >
            {track.map((img, i) => {
              const index = i % galleryImages.length;
              return (
                <button
                  key={i}
                  type="button"
                  aria-hidden={i >= galleryImages.length}
                  tabIndex={i >= galleryImages.length ? -1 : 0}
                  onClick={() => setOpenIndex(index)}
                  className="relative h-60 shrink-0 overflow-hidden rounded-xl shadow-lg ring-1 ring-white/5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D90000] sm:h-72 lg:h-80"
                >
                  <Image
                    src={img.src}
                    alt={`Fotka kapely ${index + 1}`}
                    width={img.width}
                    height={img.height}
                    sizes="(max-width: 640px) 60vw, 40vw"
                    className="h-full w-auto max-w-none saturate-[.92] transition duration-500 ease-out hover:scale-[1.04] hover:saturate-110"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <GalleryLightbox
        images={galleryImages}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </section>
  );
}
