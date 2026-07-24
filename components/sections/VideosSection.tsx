"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { youtubeShorts } from "@/lib/data";
import ShortCard, { getYouTubeId } from "../ui/ShortCard";
import ReelsModal from "../ui/ReelsModal";

export default function VideosSection() {
  const feedRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const scroll = (dir: number) => {
    feedRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  };

  const ids = youtubeShorts.map(getYouTubeId);

  return (
    <section
      id="Videa"
      className="relative py-20 text-white flex flex-col items-center"
    >
      <h2 className="text-5xl mx-10 text-stroke-2 brightness-85 font-bold font-orbitron text-center mb-12 sm:text-6xl md:text-7xl md:text-stroke-4 lg:text-8xl">
        <span className="text-black">PO</span>
        <span className="text-[#D90000]">SLECHNI SI NÁS</span>
      </h2>
      <p className="mb-12 text-center text-xl px-10 text-stone-300">
        Mrkni na naše ukázky – a víc jich najdeš na našem
        <a
          className="font-bold text-stone-400 transition-colors duration-300 ease-in-out hover:text-[#D90000]"
          href="https://www.instagram.com/maly.veci.official?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
        >
          {" "}
          Instagramu{" "}
        </a>{" "}
        a také na
        <a
          className="font-bold text-stone-400 transition-colors duration-300 ease-in-out hover:text-[#D90000]"
          href="https://www.youtube.com/@Mal%C3%BDV%C4%9BciOfficial/videos"
        >
          {" "}
          YouTube
        </a>
        .
      </p>

      {/* Feed Shorts – scrollovatelný do stran */}
      <div className="relative w-full max-w-6xl px-4">
        {ids.length > 0 && (
          <>
            <button
              aria-label="Předchozí"
              onClick={() => scroll(-1)}
              className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur transition hover:bg-[#D90000] sm:block"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              aria-label="Další"
              onClick={() => scroll(1)}
              className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur transition hover:bg-[#D90000] sm:block"
            >
              <ChevronRight size={28} />
            </button>
          </>
        )}

        <div
          ref={feedRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 py-4 no-scrollbar"
        >
          {ids.map((id, i) => (
            <ShortCard key={`${id}-${i}`} id={id} onOpen={() => setOpenIndex(i)} />
          ))}
        </div>
      </div>

      <ReelsModal ids={ids} index={openIndex} onClose={() => setOpenIndex(null)} />
    </section>
  );
}
