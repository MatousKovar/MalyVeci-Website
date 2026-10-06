"use client";

import { useState, useEffect } from "react";
import React from "react";
import Image from "next/image";
import Navbar from "../../components/Navbar";
import uvodka from "../../public/uvodka.jpg";
import heroImgMobile from "../../public/uvodka_mobil.jpeg";

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
  eventsError: boolean;
  isAdmin: boolean;
};

export default function HomePage({ events, eventsError, isAdmin }: HomePageProps) {
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
      <div className="fixed sm:block inset-0 z-0">
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
          hasError={eventsError}
          isAdmin={isAdmin}
          showPosterFunction={(src) => setPoster(src)}
        />
        <GallerySection />
        <VideosSection />
        <RepertoarSection />
        <ContactsSection />

        <section id="Rights" className="relative text-center text-stone-300">
          <p className="text-[#D90000] text-sm">
            © {new Date().getFullYear()} Matouš Kovář. Všechna práva vyhrazena.
          </p>
        </section>
      </main>

      <PosterModal posterSrc={poster} onClose={() => setPoster(null)} />
    </div>
  );
}
