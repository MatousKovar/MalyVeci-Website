"use client";
import { useRef, useState, useEffect } from "react";
import { members } from "@/lib/data";
import MemberCard from "../ui/MemberCard";

export default function ONasSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(members.length - 1, i));
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[clamped] as HTMLElement | undefined;
    if (child) {
      track.scrollTo({ left: child.offsetLeft - track.offsetLeft, behavior: "smooth" });
    }
    setActive(clamped);
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const center = track.scrollLeft + track.clientWidth / 2;
        let bestIdx = 0;
        let bestDist = Infinity;
        Array.from(track.children).forEach((c, i) => {
          const el = c as HTMLElement;
          const mid = el.offsetLeft + el.offsetWidth / 2;
          const dist = Math.abs(mid - (track.offsetLeft + center));
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
          }
        });
        setActive(bestIdx);
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section id="onas" className="py-20 bg-black text-white mt-20 z-10">
      <h2
        className="text-stroke-2 text-5xl font-bold font-orbitron text-center mb-12
              sm:text-6xl md:text-7xl md:text-stroke-4 lg:text-8xl"
      >
        <span className="text-black brightness-85">O </span>
        <span className="text-[#D90000] brightness-85">KAPELE</span>
      </h2>
      <div className=" flex text-md md:mx-45 mx-10 sm:my-16 grid sm:grid-cols-1 md:grid-cols-2 gap-4 mb-30 z-10 text-center">
        <div className=" text-left text-stone-300 mx-auto max-w-140  leading-relaxed text-gray-100 px-4 py-4 rounded-lg shadow-lg z-10">
          <p className="mb-3">Jsme Malý Věci! Trochu jiná zábavová kapela.</p>
          <p className="mb-3">
            Naše pětičlenná parta vznikla v roce 2024 ve Strakonicích původně
            jako způsob, jak trávit volný čas s nástroji v ruce. Brzy nás ale
            začalo lákat hrát i pro lidi – a tak jsme už během prvního roku
            existence odehráli 19 akcí, mezi nimi dva firemní večírky, dvě
            svatby a ještě k tomu zvládli i státnice.
          </p>
          <p className="text-[#D90000] text-lg mb-3">
            <strong>Řídime se dvěma hlavními motty:</strong>
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-3">
            <li>
              <strong>Pestrý repertoár</strong> – chceme, aby si na své přišli
              mladší, starší, rockovější i popovější posluchači. Proto hrajeme
              co nejvíce různých žánrů – od Katy Perry přes Kabáty až po Bon
              Jovi.
            </li>
            <li>
              <strong>Hudba nás musí bavit</strong> - pokud hudba baví kapelu,
              tak to baví i lidi. Naší hlavní motivací je láska k hudbě, kterou
              často dáváme najevo jak pohybem, tak zapálením při hraní.
            </li>
          </ul>
          <p className="mb-3">
            Jsme technicky vybavená kapela, vlastníme jak ozvučovací soustavu,
            tak základní osvětlení, takže váš parket nebude nikdy vypadat nudně.
            Zkrátka zníme i vypadáme profesionálně.
          </p>
        </div>
        <div className=" text-left text-stone-300 mx-auto max-w-140  leading-relaxed text-gray-100 px-4 py-4 rounded-lg shadow-lg z-10">
          <p className="mb-3">
            Po domluvě jsme schopni doplnit naše vystoupení i o DJ a náš
            kytarista se postará i o plakát, který nebude jen obyčejnou
            pozvánkou, ale skutečně upoutá.
          </p>
          <p className="mb-3 text-lg">
            {" "}
            <strong className="text-[#D90000]">
              Proč si vybrat kapelu Malý Věci?
            </strong>
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Pestrý repertoár pro všechny generace</strong> - náš
              aktuální repertoár čítá přes 90 kousků napříč žánry a etapami
              populární hudby. Chcete rockový koncert, retro party ve stylu 80.
              let nebo jen prostě klasickou tancovačku se skladbami, které znáte
              a milujete? Pak jsme ti praví.
            </li>
            <li>
              <strong>Jsme mladá krev</strong> - naše vystoupení je stejně tak o
              hudbě jako o energii a atmosféře, když hrajeme, tak prostě
              nevydržíme stát na místě.
            </li>
            <li>
              <strong>Levnější než konkurence</strong> - hudba pro nás nikdy
              nebyla o penězích, proto vyjdeme vstříc i pořadatelům menších
              akcí.{" "}
            </li>
            <li>
              <strong>Ctíme originál</strong> - Oproti většině zábavových kapel
              se snažíme přiblížit se co nejvíce originálním nahrávkám. U nás to
              není jen o tom zahrát pár akordů a zazpívat stejná slova.{" "}
            </li>
          </ul>
        </div>
      </div>

      {/* Member carousel */}
      <div className="relative z-10 max-w-2xl mx-auto px-4">
        <div
          ref={trackRef}
          className="
            flex
            overflow-x-auto
            snap-x snap-mandatory
            gap-4
            [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          "
        >
          {members.map((member, i) => (
            <div key={i} className="snap-center shrink-0 w-full">
              <MemberCard i={i} {...member} />
            </div>
          ))}
        </div>

        {/* Prev / Next */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            aria-label="Předchozí člen"
            className="
              w-11 h-11 rounded-full border border-white/20
              flex items-center justify-center
              text-white/80 hover:text-white hover:border-[#D90000]
              transition disabled:opacity-30 disabled:hover:border-white/20
            "
          >
            ‹
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {members.map((m, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Zobrazit ${m.name}`}
                className={`h-1.5 rounded-full transition-all ${
                  active === i
                    ? "w-8 bg-[#D90000]"
                    : "w-1.5 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => goTo(active + 1)}
            disabled={active === members.length - 1}
            aria-label="Další člen"
            className="
              w-11 h-11 rounded-full border border-white/20
              flex items-center justify-center
              text-white/80 hover:text-white hover:border-[#D90000]
              transition disabled:opacity-30 disabled:hover:border-white/20
            "
          >
            ›
          </button>
        </div>

        <p className="text-center text-xs tracking-[0.2em] uppercase text-stone-400 mt-3">
          {String(active + 1).padStart(2, "0")} / {String(members.length).padStart(2, "0")}
        </p>
      </div>
    </section>
  );
}
