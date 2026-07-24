"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { galleryImages } from "@/lib/gallery-images";
import GalleryLightbox from "@/../components/ui/GalleryLightbox";

export default function GallerySection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="Fotogalerie" className="py-20 text-white">
      <h2 className="text-5xl text-stroke-2 brightness-85 font-bold font-orbitron text-center mb-12 sm:text-6xl md:text-7xl md:text-stroke-4 lg:text-8xl">
        <span className="text-black">FO</span>
        <span className="text-[#D90000]">TOGRAFIE</span>
      </h2>

      <div className="mx-auto max-w-7xl px-4">
        {/* Masonry přes CSS columns – fotky na výšku i na šířku zapadnou bez ořezu */}
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 [column-fill:_balance]">
          {galleryImages.map((img, i) => (
            <motion.button
              key={img.src}
              type="button"
              onClick={() => setOpenIndex(i)}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08, ease: "easeOut" }}
              className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl shadow-lg ring-1 ring-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D90000]"
            >
              <div className="relative overflow-hidden">
                <Image
                  src={img.src}
                  alt={`Fotka kapely ${i + 1}`}
                  width={img.width}
                  height={img.height}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  className="h-auto w-full scale-100 saturate-[.92] transition duration-500 ease-out group-hover:scale-[1.04] group-hover:saturate-110"
                />
                {/* Jemné ztmavení + rozzáření při najetí */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>
            </motion.button>
          ))}
        </div>

        {galleryImages.length === 0 && (
          <p className="text-center text-white/50">
            Zatím tu nejsou žádné fotky – nahraj je do složky <code>public/gallery</code>.
          </p>
        )}
      </div>

      <GalleryLightbox
        images={galleryImages}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </section>
  );
}
