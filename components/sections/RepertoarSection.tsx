import { spotifyTracks } from "@/lib/data";
import SongIframe from "../ui/SongIframe";

export default function RepertoarSection() {
  return (
    <section
      id="repertoar"
      className=" relative py-20 text-white flex flex-col items-center"
    >
      <h2 className="text-5xl text-stroke-2 brightness-85 font-bold font-orbitron text-center mb-12 sm:text-6xl md:text-7xl md:text-stroke-4 lg:text-8xl">
        <span className="text-black">RE</span>
        <span className="text-[#D90000]">PERTOÁR</span>
      </h2>
      <p className="text-stone-300 text-lg mx-10 md:mx-40 text-center">
        Hrajeme pro radost – a pro všechny. Náš repertoár čítá přes 90 skladeb
        napříč žánry – od legendárních klasik až po současné hity. Hrajeme
        pomalu i rychle, česky i anglicky, vážně i s recesí, popově i rockově.
        Zkrátka – s námi se nudit rozhodně nebudete! Pro zaslání kompletního
        repertoáru nebo přidání písní na přání nás prosím
        <a
          className="font-bold text-stone-400 transition-colors duration-300 ease-in-out hover:text-[#D90000]"
          href="#Kontakty"
        >
          {" "}
          kontaktujte.
        </a>
      </p>
      <div className="w-full max-w-6xl overflow-x-hidden mt-15">
        {/* Scrolling wrapper */}
        <div className="flex animate-scroll space-x-4 w-max">
          {spotifyTracks.map((track, index) => (
            <SongIframe
              key={index} // React vyžaduje unikátní klíč
              src={track} // Předání URL do komponenty
            />
          ))}
        </div>
      </div>
    </section>
  );
}
