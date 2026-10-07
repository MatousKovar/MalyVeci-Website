"use client";

import { useState } from "react";
import shorts from "@/content/shorts.json";
import { validateShorts } from "@/lib/content-validation.mjs";
import { getYouTubeId } from "../ui/youtube";
import ShortsCarousel from "../ui/ShortsCarousel";
import ReelsModal from "../ui/ReelsModal";

const shortsContent = validateShorts(shorts);
const youtubeShorts = [...shortsContent.items]
  .sort((first, second) => first.order - second.order)
  .map((short) => short.videoId);

export default function VideosSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const ids = youtubeShorts.map(getYouTubeId);
  // Na který reel má carousel při načtení vycentrovat (fallback = první).
  const startIndex = Math.max(ids.indexOf("iDQUGjGwNrs"), 0);

  return (
    <section
      id="Videa"
      className="relative py-20 text-white flex flex-col items-center"
    >
      <h2 className="text-5xl mx-10 text-stroke-2 brightness-85 font-bold font-orbitron text-center mb-12 sm:text-6xl md:text-7xl md:text-stroke-4 lg:text-8xl">
        <span className="text-black">PO</span>
        <span className="text-[#D90000]">SLECHNI SI NÁS</span>
      </h2>
      <p className="mb-8 text-center text-xl px-10 text-stone-300">
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

      {shortsContent.errors.length > 0 && (
        <p role="alert" className="mx-auto mb-6 max-w-3xl px-5 text-center text-sm text-amber-200">
          Některá krátká videa se nepodařilo načíst. {shortsContent.errors.join(" ")}
        </p>
      )}
      {ids.length > 0 ? (
        <ShortsCarousel ids={ids} onOpen={(i) => setOpenIndex(i)} initialIndex={startIndex} />
      ) : (
        <p className="text-center text-stone-400">Zatím tu nejsou žádná krátká videa.</p>
      )}

      <ReelsModal ids={ids} index={openIndex} onClose={() => setOpenIndex(null)} />
    </section>
  );
}
