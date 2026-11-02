"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import galleryPhotos from "@/content/gallery.json";
import { validateGalleryPhotos } from "@/lib/content-validation.mjs";
import GalleryLightbox from "@/../components/ui/GalleryLightbox";
import GalleryPhotoDelete from "@/app/admin/GalleryPhotoDelete";
import type { GalleryPhotoContent } from "@/lib/content-types";
import styles from "./GallerySection.module.css";

const galleryContent = validateGalleryPhotos(galleryPhotos);
const initialGalleryImages = [...galleryContent.items].sort(
  (first, second) => first.order - second.order,
);

export default function GallerySection({ isAdmin = false }: { isAdmin?: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState(initialGalleryImages);
  const [photoToDelete, setPhotoToDelete] = useState<GalleryPhotoContent | null>(null);
  const [message, setMessage] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);
  const manuallyScrolled = useRef(false);

  // Pás zdvojíme, aby se posouval nekonečně bez švu.
  const track = [...galleryImages, ...galleryImages];

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = viewport?.firstElementChild;
    if (!viewport || !(content instanceof HTMLElement)) return;

    let frame: number | undefined;
    let loopWidth = 0;
    let previousTime = 0;
    const duration = Math.max(galleryImages.length * 5, 20) * 1000;

    function measure() {
      const first = content?.children[0];
      const duplicate = content?.children[galleryImages.length];
      if (first instanceof HTMLElement && duplicate instanceof HTMLElement) {
        loopWidth = duplicate.offsetLeft - first.offsetLeft;
      }
    }

    function stopAutoplay() {
      manuallyScrolled.current = true;
      if (frame !== undefined) cancelAnimationFrame(frame);
    }

    function onWheel(event: WheelEvent) {
      if (event.ctrlKey || !viewport) return;
      stopAutoplay();
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;

      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? viewport.clientWidth : 1;
      const delta = event.deltaY * unit;
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      if ((delta > 0 && viewport.scrollLeft < maxScroll - 1) ||
          (delta < 0 && viewport.scrollLeft > 1)) {
        event.preventDefault();
        viewport.scrollLeft += delta;
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (["ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown", " "].includes(event.key)) {
        stopAutoplay();
      }
    }

    function animate(time: number) {
      if (!viewport) return;
      const elapsed = previousTime ? Math.min(time - previousTime, 64) : 0;
      previousTime = time;
      if (loopWidth > 0 && !viewport.matches(":hover, :focus-within")) {
        viewport.scrollLeft = (viewport.scrollLeft + elapsed * loopWidth / duration) % loopWidth;
      }
      frame = requestAnimationFrame(animate);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    observer.observe(viewport);
    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("pointerdown", stopAutoplay);
    viewport.addEventListener("keydown", onKeyDown);
    if (!manuallyScrolled.current && openIndex === null && photoToDelete === null &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame = requestAnimationFrame(animate);
    }

    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      observer.disconnect();
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("pointerdown", stopAutoplay);
      viewport.removeEventListener("keydown", onKeyDown);
    };
  }, [galleryImages.length, openIndex, photoToDelete]);

  return (
    <section id="Fotogalerie" className="py-20 text-white">
      <h2 className="text-5xl text-stroke-2 brightness-85 font-bold font-orbitron text-center mb-12 sm:text-6xl md:text-7xl md:text-stroke-4 lg:text-8xl">
        <span className="text-black">FO</span>
        <span className="text-[#D90000]">TOGRAFIE</span>
      </h2>
      {message && <p role="status" className="mb-6 px-5 text-center text-sm text-stone-300">{message}</p>}

      {galleryContent.errors.length > 0 && (
        <p role="alert" className="mx-auto mb-6 max-w-3xl px-5 text-center text-sm text-amber-200">
          Některé fotky galerie se nepodařilo načíst. {galleryContent.errors.join(" ")}
        </p>
      )}

      {galleryImages.length === 0 ? (
        <p className="text-center text-white/50">
          Zatím tu nejsou žádné fotky.
        </p>
      ) : (
        <div
          ref={viewportRef}
          role="region"
          aria-label="Fotogalerie kapely"
          tabIndex={0}
          className={styles.viewport}
          // Jemné rozplynutí na krajích pásu
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
            maskImage:
              "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          }}
        >
          <div className={styles.track}>
            {track.map((img, i) => {
              const index = i % galleryImages.length;
              return (
                <div key={`${img.id}-${i}`} className="shrink-0" aria-hidden={i >= galleryImages.length}>
                <button
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
                {isAdmin && (
                  <button
                    type="button"
                    tabIndex={i >= galleryImages.length ? -1 : 0}
                    onClick={() => { setOpenIndex(null); setPhotoToDelete(img); }}
                    className="mt-2 block rounded-md border border-red-700 bg-stone-950 px-4 py-2 text-sm text-red-200 hover:bg-red-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
                  >
                    Smazat fotku {index + 1}
                  </button>
                )}
                </div>
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
      {isAdmin && photoToDelete && (
        <GalleryPhotoDelete
          photo={photoToDelete}
          onClose={() => setPhotoToDelete(null)}
          onDeleted={(id, message) => {
            setGalleryImages((images) => images.filter((photo) => photo.id !== id));
            setMessage(message);
          }}
        />
      )}
    </section>
  );
}
