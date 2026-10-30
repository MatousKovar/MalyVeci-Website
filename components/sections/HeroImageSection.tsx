import Image from "next/image";
import { ArrowDown } from "lucide-react";
import uvodka from "@/../public/gallery/IMG_8116.jpeg";
import heroImg from "@/../public/logomv.png";
import heroImgMobile from "@/../public/gallery/IMG_8126.jpeg";

type HeroImageProps = { blur: number };

export default function HeroImageSection({ blur }: HeroImageProps) {
  return (
    <section
      aria-label="Malý Věci"
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: 480,
        overflow: "hidden",
        backgroundColor: "#000",
      }}
    >
      <div className="absolute inset-0 hidden md:block">
        <Image
          src={uvodka}
          alt="Foto kapely"
          fill
          sizes="100vw"
          className="transition-all duration-300"
          style={{ objectFit: "cover", filter: `blur(${blur}px)` }}
          priority
        />
      </div>
      <div className="absolute inset-0 md:hidden">
        <Image
          src={heroImgMobile}
          alt="Foto kapely"
          fill
          sizes="100vw"
          className="transition-all duration-300"
          style={{ objectFit: "cover", filter: `blur(${blur}px)` }}
          priority
        />
      </div>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.25) 28%, transparent 60%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "clamp(96px, 12vh, 140px)",
          transform: "translateX(-50%)",
          width: "clamp(220px, 24vw, 360px)",
          maxWidth: "calc(100% - 48px)",
          textAlign: "center",
        }}
      >
        <Image
          src={heroImg}
          alt="Malý Věci"
          width={360}
          height={231}
          sizes="(min-width: 1500px) 360px, (min-width: 920px) 24vw, 220px"
          style={{ display: "block", width: "100%", maxWidth: 360, height: "auto", opacity: 0.7 }}
          priority
        />
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.08em] text-stone-200">
          <span className="font-semibold">Kapela</span>
          <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-[#D90000]" />
          <span>Strakonice / Horažďovice</span>
          <span className="text-stone-300">Od 2024</span>
        </p>
      </div>
      <button
        type="button"
        aria-label="Přejít na informace o kapele"
        onClick={() => document.getElementById("onas")?.scrollIntoView({ behavior: "smooth" })}
        className="absolute bottom-6 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-white/30 bg-black/30 text-stone-200 transition-colors hover:border-[#D90000] hover:bg-[#D90000] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500"
      >
        <ArrowDown size={20} aria-hidden="true" />
      </button>
    </section>
  );
}
