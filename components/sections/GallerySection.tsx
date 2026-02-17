import Image from "next/image";
import { images } from "@/lib/data";

type GallerySectionProps = {setPoster: (src: string) => void}

export default function GallerySection({setPoster}: GallerySectionProps ) {
  return (
    <section id="Fotogalerie" className="py-20t text-white">
      <h2 className="text-5xl text-stroke-2 brightness-85 font-bold font-orbitron text-center mb-12 sm:text-6xl md:text-7xl md:text-stroke-4 lg:text-8xl">
        <span className="text-black">FO</span>
        <span className="text-[#D90000]">TOGRAFIE</span>
      </h2>

      <div className="relative max-w-7xl mx-auto px-4">
        {/* Buttons */}
        <button
          onClick={() =>
            document
              .getElementById("galleryScroll")!
              .scrollBy({ left: -300, behavior: "smooth" })
          }
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/50 rounded-full hover:bg-black/70"
        >
          &#8592;
        </button>
        <button
          onClick={() =>
            document
              .getElementById("galleryScroll")!
              .scrollBy({ left: 300, behavior: "smooth" })
          }
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/50 rounded-full hover:bg-black/70"
        >
          &#8594;
        </button>

        {/* Scrollable gallery */}
        <div
          id="galleryScroll"
          className="flex overflow-x-auto gap-4 scroll-smooth py-4 no-scrollbar"
        >
          {images.map((src, i) => (
            <div
              key={i}
              className=" flex-shrink-0 rounded-lg overflow-hidden shadow-lg cursor-pointer"
            >
              <Image
                src={src}
                alt={`Kapela foto ${i}`}
                onClick={() => setPoster(src)}
                width={300}
                height={200}
                objectFit="cover"
                className="w-full h-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
