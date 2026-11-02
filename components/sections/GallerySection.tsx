"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const viewportId = useId();
  const [canScroll, setCanScroll] = useState({ previous: false, next: false });
  const track = [...galleryImages, ...galleryImages];

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = viewport?.firstElementChild;
    if (!viewport || !(content instanceof HTMLElement)) return;

    let frame: number | undefined;
    let loopWidth = 0;
    let previousTime = 0;
    const duration = Math.max(galleryImages.length * 5, 20) * 1000;

    function updateControls() {
      if (!viewport) return;
      const previous = viewport.scrollLeft > 2;
      const next = viewport.scrollLeft < viewport.scrollWidth - viewport.clientWidth - 2;
      setCanScroll((current) => current.previous === previous && current.next === next
        ? current
        : { previous, next });
    }

    function measure() {
      const first = content?.children[0];
      const duplicate = content?.children[galleryImages.length];
      if (first instanceof HTMLElement && duplicate instanceof HTMLElement) {
        loopWidth = duplicate.offsetLeft - first.offsetLeft;
      }
      const photo = first?.querySelector("[data-gallery-photo]");
      const container = viewport?.parentElement;
      if (photo && container) {
        const bounds = photo.getBoundingClientRect();
        const center = bounds.top - container.getBoundingClientRect().top + bounds.height / 2;
        container.style.setProperty("--gallery-image-center", `${center}px`);
      }
      updateControls();
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
      if (!viewport || manuallyScrolled.current) return;
      const elapsed = previousTime ? Math.min(time - previousTime, 64) : 0;
      previousTime = time;
      if (loopWidth > viewport.clientWidth && !viewport.parentElement?.matches(":hover, :focus-within")) {
        viewport.scrollLeft = (viewport.scrollLeft + elapsed * loopWidth / duration) % loopWidth;
      }
      frame = requestAnimationFrame(animate);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    observer.observe(viewport);
    viewport.addEventListener("scroll", updateControls, { passive: true });
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
      viewport.removeEventListener("scroll", updateControls);
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("pointerdown", stopAutoplay);
      viewport.removeEventListener("keydown", onKeyDown);
    };
  }, [galleryImages.length, openIndex, photoToDelete]);

  function scrollGallery(direction: -1 | 1) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    manuallyScrolled.current = true;
    viewport.scrollBy({
      left: direction * viewport.clientWidth * 0.85,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

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
        <div className={styles.gallery}>
          <div
            id={viewportId}
            ref={viewportRef}
            role="region"
            aria-label="Fotogalerie kapely"
            tabIndex={0}
            className={styles.viewport}
            style={{
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
              maskImage:
                "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
            }}
          >
            <div className={styles.track} style={{ display: "flex", flexFlow: "row nowrap" }}>
              {track.map((img, i) => {
                const index = i % galleryImages.length;
                const duplicate = i >= galleryImages.length;
                return (
                  <div key={`${img.id}-${i}`} className={styles.item} aria-hidden={duplicate}>
                    <button
                      type="button"
                      data-gallery-photo
                      tabIndex={duplicate ? -1 : 0}
                      onClick={() => setOpenIndex(index)}
                      className={styles.photo}
                    >
                      <Image
                        src={img.src}
                        alt={`Fotka kapely ${index + 1}`}
                        width={img.width}
                        height={img.height}
                        sizes="(max-width: 640px) 80vw, 60vw"
                        className={styles.image}
                      />
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        tabIndex={duplicate ? -1 : 0}
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
          <div role="group" aria-label="Posun galerie" className={styles.controls}>
            <button
              type="button"
              aria-label="Předchozí fotografie"
              aria-controls={viewportId}
              disabled={!canScroll.previous}
              onClick={() => scrollGallery(-1)}
              className={styles.arrow}
            >
              <ChevronLeft size={24} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Další fotografie"
              aria-controls={viewportId}
              disabled={!canScroll.next}
              onClick={() => scrollGallery(1)}
              className={styles.arrow}
            >
              <ChevronRight size={24} aria-hidden="true" />
            </button>
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
