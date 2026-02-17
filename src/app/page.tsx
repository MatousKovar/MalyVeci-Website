"use client";
import { useState, useEffect } from "react";
import React from "react";
import Image from "next/image";
import Navbar from "../../components/Navbar";
import uvodka from "../../public/uvodka.jpg";
import heroImgMobile from "../../public/uvodka_mobil.jpeg";

import { members, images } from "@/lib/data"; // importing data
import EventSection from "@/../components/sections/EventSection";
import PosterModal from "@/../components/ui/PosterModal";
import HeroImageSection from "../../components/sections/HeroImageSection";
import ONasSection from "../../components/sections/ONasSection";
import GallerySection from "../../components/sections/GallerySection";
import VideosSection from "../../components/sections/VideosSection";
import RepertoarSection from "../../components/sections/RepertoarSection";
import ContactsSection from "../../components/sections/ContactsSection";

export default function Home() {
  const [poster, setPoster] = useState<string | null>(null);
  const [blur, setBlur] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setBlur(Math.min(scrollY / 50, 20));
    };
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative text-stone-300">
      {/* Background */}
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
      {/* background mobile */}
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

      {/* Overlay to darken for readability */}
      {/* <div className="fixed inset-0 z-0 bg-black/30" /> */}

      <Navbar />

      <HeroImageSection blur={blur} />

      <main>

        <ONasSection />

        <EventSection showPosterFunction={(src) => setPoster(src)} />

        <GallerySection setPoster={(src) => setPoster(src)} />

        <VideosSection />

        <RepertoarSection/>

        <ContactsSection/>
        
        <section id="Rights" className=" relative text-center text-stone-300">
          <p className="text-[#D90000] text-sm">
            © {new Date().getFullYear()} Matouš Kovář. Všechna práva vyhrazena.
          </p>
        </section>
      </main>

      {/* Injecting poster element which is shown as fixed when poster is changed*/}
      <PosterModal posterSrc={poster} onClose={() => setPoster(null)} />
    </div>
  );
}
