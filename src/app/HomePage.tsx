"use client";

import { useState, useEffect } from "react";
import React from "react";
import Image from "next/image";
import Navbar from "../../components/Navbar";
import uvodka from "../../public/gallery/IMG_8116.jpeg";
import heroImgMobile from "../../public/gallery/IMG_8126.jpeg";

import EventSection from "@/../components/sections/EventSection";
import PosterModal from "@/../components/ui/PosterModal";
import HeroImageSection from "../../components/sections/HeroImageSection";
import ONasSection from "../../components/sections/ONasSection";
import GallerySection from "../../components/sections/GallerySection";
import VideosSection from "../../components/sections/VideosSection";
import RepertoarSection from "../../components/sections/RepertoarSection";
import ContactsSection from "../../components/sections/ContactsSection";
import type { ManagedEvent } from "@/lib/events";

type HomePageProps = {
  events: ManagedEvent[];
  eventErrors: string[];
  isAdmin: boolean;
  today: string;
};

export default function HomePage({
  events,
  eventErrors,
  isAdmin,
  today,
}: HomePageProps) {
  const [poster, setPoster] = useState<string | null>(null);
  const [blur, setBlur] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setBlur(Math.min(window.scrollY / 50, 20));
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative text-stone-300">
      <div className="fixed hidden md:block inset-0 z-0">
        <Image
          src={uvodka}
          alt="foto kapely pozadi"
          fill
          className="object-cover"
          style={{ filter: "blur(30px) brightness(0.35)" }}
          priority
        />
      </div>
      <div className="fixed md:hidden inset-0 z-0">
        <Image
          src={heroImgMobile}
          alt="foto kapely pozadi"
          fill
          className="object-cover"
          style={{ filter: "blur(30px) brightness(0.35)" }}
          priority
        />
      </div>

      <Navbar />
      <HeroImageSection blur={blur} />

      <main>
        <ONasSection />
        <EventSection
          events={events}
          errors={eventErrors}
          isAdmin={isAdmin}
          today={today}
          showPosterFunction={(src) => setPoster(src)}
        />
        <GallerySection isAdmin={isAdmin} />
        <VideosSection isAdmin={isAdmin} />
        <RepertoarSection />
        <ContactsSection />

        <footer id="Rights" className="relative px-4 pb-8 text-center text-stone-300">
          <p className="text-[#D90000] text-sm">
            © {new Date().getFullYear()} Matouš Kovář. Všechna práva vyhrazena.
          </p>
          <a href="/admin" className="mx-auto mt-6 inline-flex min-h-11 items-center justify-center rounded-md border border-stone-500/70 px-4 py-2 text-sm text-stone-300 transition-colors hover:border-[#D90000] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500">
            Správa webu
          </a>
        </footer>
      </main>

      <PosterModal posterSrc={poster} onClose={() => setPoster(null)} />
    </div>
  );
}
