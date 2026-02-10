'use client'
import { useState, useEffect } from 'react';
import React from "react";
import Image from "next/image";
import heroImg from "../../public/logomv.png"; 
import heroImgMobile from "../../public/uvodka_mobil.jpeg";
import matous from "../../public/ja.jpeg";
import mates from "../../public/basak.jpeg";
import jiri from "../../public/2.png";
import roubalka from "../../public/roubalka.jpeg";
import uvodka from "../../public/uvodka.jpg";
import prokop from "../../public/prokop.jpeg";
import Navbar from '../../components/Navbar';

const images = [
  "/12.PNG",
  "/1.PNG",
  "/jinin.jpeg",
  "/galeriexx.jpg",
  "/9.PNG",
  "/15.jpeg",
  "/jinin2.png",
  "/houba.jpeg",
  "/14.jpeg",
  "/novosedly.jpeg",
  "/4.PNG",
  "/5.PNG",
  "/hlavacci.jpeg",
  "/7.PNG",
  "/roubalka_deti.jpg",
  "/8.PNG",
  "/11.PNG",
];

const members = [
  {
    name: "Matouš Kovář",
    role: "Sólová kytara",
    bio: "Kapelník, zvukař a tahoun celé kapely. Řídí zkoušky i koncerty, dohlíží na zvuk a zároveň přidává kytarová sóla, která dávají našim vystoupením drive.",
    image: matous,
  },
  {
    name: "Jiří Bártík",
    role: "Rytmická kytara",
    bio: "Rytmická jistota a autor vizuálů kapely. Stará se o plakáty i grafiku, na pódiu přidává kytaru a vlastní nápady, které dodávají koncertům originální náboj.",
    image: jiri,
  },
  {
    name: "Denisa Roubalová",
    role: "Zpěv",
    bio: "Hlavní hlas kapely a královna pódiové energie. Stará se o sociální sítě i vizuální styl kapely a na pódiu kombinuje zpěv s tancem, takže se publikum nikdy nenudí.",
    image: roubalka,
  },
  {
    name: "Matyáš Fojtů",
    role: "Basa",
    bio: "Basák, bavič a moderátor večerů. Jeho rytmus drží kapelu pohromadě a jeho hlášky i improvizace baví publikum stejně jako hudba.",
    image: mates,
  },
  {
    name: "Petr Roubal",
    role: "Bicí",
    bio: "Metronom, který drží pevné tempo a udává energii celé kapele. Kromě bubnů má na starosti i tvorbu setlistů a s Denisou tvoří vokální duo, které dodává koncertům další rozměr.",
    image: prokop,
  },
];

type PosterModalProps = {
  posterSrc: string | null;  // path to the image, can be null when closed
  onClose: () => void;       // callback when closing
};

function PosterModal({ posterSrc, onClose } : PosterModalProps ) {
  if (!posterSrc) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="relative bg-gray-900 p-4 rounded-xl shadow-xl">
        {/* Poster image */}
        <Image
          src={posterSrc}
          alt="Event Poster"
          width={500}
          height={500}
          className="rounded-lg object-contain w-full h-auto"
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
        >
          ✕
        </button>
      </div>
    </div>
  );
}


export default function Home() {
  const [poster, setPoster] = useState<string | null>(null);
  const [blur, setBlur] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // grows blur as you scroll (max 20px)
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
            style={{ filter: 'blur(30px) brightness(0.35)' }}
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
            style={{ filter: 'blur(30px) brightness(0.35)' }}
            priority
          />
      </div>

        {/* Overlay to darken for readability */}
      {/* <div className="fixed inset-0 z-0 bg-black/30" /> */}

    
    <Navbar />
    

   <section className="relative w-full h-screen flex justify-center items-center bg-black overflow-hidden">
      {/* hero image */}
      <div className="absolute sm:block inset-0">
        <Image
          src={uvodka}
          alt="Foto kapely"
          fill
          className="object-cover transition-all duration-300"
          style={{ filter: `blur(${blur}px)` }}
          priority
        />
      </div>
      {/* Hero image mobile */}
      <div className="absolute md:hidden inset-0">
        <Image
          src={heroImgMobile}
          alt="foto kapely mobil"
          fill
          className="object-cover transition-all duration-300"
          style={{ filter: `blur(${blur}px)` }}
          priority
        />
      </div>

      {/* Overlay for better readability */}
      <div className="relative w-full mt-80">
      {/* Black bar background (matches image height) */}
      <div className="absolute inset-0 bg-black/30" />
        {/* Foreground content */}
        <div className="relative mx-auto w-64 h-50 md:w-96 md:h-75 brightness-75 z-10">
          <Image
            src={heroImg}
            alt="Logo kapely"
            fill
            className="object-contain filter z-5"
            priority
           />
          
        </div>
      </div>

        {/* Scroll Down Button */}
        <button
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          className="absolute animate-bounce bottom-6 left-1/2 -translate-x-1/2 p-5 rounded-full bg-black/80 hover:bg-[#D90000] transition-colors duration-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
    </section>

      {/* Main Sections */}
      <main>
        <section id="onas" className="py-20 bg-black text-white mt-20 z-10">
          <h2
            className="text-stroke-2 text-5xl font-bold font-orbitron text-center mb-12 
            sm:text-6xl md:text-7xl md:text-stroke-4 lg:text-8xl"
          >
            <span className="text-black brightness-85">O </span>
            <span className="text-[#D90000] brightness-85">KAPELE</span>
          </h2>
          <div className=" flex text-md md:mx-45 mx-10 sm:my-16 grid sm:grid-cols-1 md:grid-cols-2 gap-4 mb-30 z-10 text-center">
            {/* <p className=" text-center mx-auto max-w-140  leading-relaxed text-gray-100 px-4 py-4 rounded-lg shadow-lg z-10"> */}
            <div className=" text-left text-stone-300 mx-auto max-w-140  leading-relaxed text-gray-100 px-4 py-4 rounded-lg shadow-lg z-10">
            <p className="mb-3">
            Jsme Malý Věci! Trochu jiná zábavová kapela.</p>
            <p className="mb-3">
            Naše pětičlenná parta vznikla v roce 2024 ve Strakonicích původně jako způsob, jak trávit volný čas s nástroji v ruce. Brzy nás ale začalo lákat hrát i pro lidi – a tak jsme už během prvního roku existence odehráli 19 akcí, mezi nimi dva firemní večírky, dvě svatby a ještě k tomu zvládli i státnice.
            </p>
            <p className="text-[#D90000] text-lg mb-3"><strong>Řídime se dvěma hlavními motty:</strong></p>            
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li><strong >Pestrý repertoár</strong> – chceme, aby si na své přišli mladší, starší, rockovější i popovější posluchači. Proto hrajeme co nejvíce různých žánrů – od Katy Perry přes Kabáty až po Bon Jovi.</li>
              <li><strong >Hudba nás musí bavit</strong> - pokud hudba baví kapelu, tak to baví i lidi. Naší hlavní motivací je láska k hudbě, kterou často dáváme najevo jak pohybem, tak zapálením při hraní.</li>
            </ul>

            <p className="mb-3">
              Jsme technicky vybavená kapela, vlastníme jak ozvučovací soustavu, tak základní osvětlení, takže váš parket nebude nikdy vypadat nudně. Zkrátka zníme i vypadáme profesionálně.
            </p>   
      
                  
              </div>
            {/* </p> */}
            <div className=" text-left text-stone-300 mx-auto max-w-140  leading-relaxed text-gray-100 px-4 py-4 rounded-lg shadow-lg z-10">
            <p className="mb-3">
            Po domluvě jsme schopni doplnit naše vystoupení i o DJ a náš kytarista se postará i o plakát, který nebude jen obyčejnou pozvánkou, ale skutečně upoutá.
            </p>
            <p className="mb-3 text-lg"> <strong className="text-[#D90000]">Proč si vybrat kapelu Malý Věci?</strong></p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Pestrý repertoár pro všechny generace</strong> - náš aktuální repertoár čítá přes 90 kousků napříč žánry a etapami populární hudby. Chcete rockový koncert, retro party ve stylu 80. let nebo jen prostě klasickou tancovačku se skladbami, které znáte a milujete? Pak jsme ti praví.</li>
              {/* <li><strong>Vlastní vybavení</strong></li> */}
              <li><strong>Jsme mladá krev</strong> - naše vystoupení je stejně tak o hudbě jako o energii a atmosféře, když hrajeme, tak prostě nevydržíme stát na místě.</li>
              <li><strong>Levnější než konkurence</strong> - hudba pro nás nikdy nebyla o penězích, proto vyjdeme vstříc i pořadatelům menších akcí. </li>
              <li><strong>Ctíme originál</strong> - Oproti většině zábavových kapel se snažíme přiblížit se co nejvíce originálním nahrávkám. U nás to není jen o tom zahrát pár akordů a zazpívat stejná slova. </li>
              
            </ul>
            </div>
          </div>
          <div className="relative max-w-5xl mx-auto space-y-16 px-4 z-10">
            {members.map((member, i) => (
              <div
                key={i}
                className={`flex mx-10 flex-col overflow-hidden lg:flex-row items-center lg:items-start md:space-x-8 ${
                  i % 2 === 0 ? "" : "lg:flex-row-reverse lg:space-x-reverse"
                }`}
              >
                <div className="relative w-38 h-48 sm:w-48 sm:h-48 md:w-64 md:h-64 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src={member.image}
                    alt={member.name}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
                <div className="mt-4 md:mt-0 text-left md:max-w-xl">
                  <h3 className="text-xl font-semibold text-[#D90000] z-10">
                    {member.name}
                  </h3>
                  <p className="text-gray-300 italic z-10">{member.role}</p>
                  <p className="text-gray-400 mt-2 z-20">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="Akce" className="py-20 text-center bg-black z-100">
          <h2
            className="brightness-85 text-6xl text-stroke-2 font-bold font-orbitron text-center mb-12 sm:text-7xl md:text-7xl md:text-stroke-4 lg:text-8xl"
          >
            <span className="text-black">A</span>
            <span className="text-[#D90000]">KCE</span>
          </h2>
          <div className="max-w-4xl mx-auto mx-10 grid md:grid-cols-2 gap-8 px-4">
            <div className="bg-stone-800/70 p-6 rounded-xl shadow-lg z-10">
              <h3 className="text-xl font-semibold mb-2 text-red-600">
                Soukromá akce
              </h3>
              <p className="text-gray-300 mb-2">Datum: 21.3.2026</p>
              <p className="text-gray-400">Horažďovice U Hlaváčků</p>
            </div>
            <div className="bg-stone-800/70 p-6 rounded-xl shadow-lg z-10">
              <h3 className="text-xl font-semibold mb-2 text-red-600">
                Velikonoční Houba
              </h3>
              <p className="text-gray-300 mb-2">Datum: 4.4.2026</p>
              <p className="text-gray-400">MC Houba Horažďovice</p>
            </div>
            <div className="bg-stone-800/70 p-6 rounded-xl shadow-lg z-10">
              <h3 className="text-xl font-semibold mb-2 text-red-600">
                Anděl Music Bar
              </h3>
              <p className="text-gray-300 mb-2">Datum: 30.5.2026</p>
              <p className="text-gray-400">Plzeň</p>
            </div>
            {/* <div className="bg-stone-800/70 p-6 rounded-xl shadow-lg z-10">
              <h3 className="text-xl font-semibold mb-2 text-red-600">
                Taneční zábava
              </h3>
              <p className="text-gray-300 mb-2">Datum: 6.12.2025</p>
              <p className="text-gray-400">Jinín, Sál nad hostincem</p>
              <button
              onClick={() => setPoster("/jinin2.png")}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
              Zobrazit plakát
              </button>
            </div> */}
            <div className="bg-stone-800/70 p-6 rounded-xl shadow-lg z-10">
              <h3 className="text-xl font-semibold mb-2 text-red-600">
                Festival Vítání léta
              </h3>
              <p className="text-gray-300 mb-2">Datum: 6.6.2026</p>
              <p className="text-gray-400">Malenice</p>
            </div>
            <div className="bg-stone-800/70 p-6 rounded-xl shadow-lg z-10">
              <h3 className="text-xl font-semibold mb-2 text-red-600">
                Svatba
              </h3>
              <p className="text-gray-300 mb-2">Datum: 20.6.2026</p>
              <p className="text-gray-400">Strakonice</p>
            </div>

            <div className="bg-stone-800/70 p-6 rounded-xl shadow-lg z-10">
              <h3 className="text-xl font-semibold mb-2 text-red-600">
                Diskotéka
              </h3>
              <p className="text-gray-300 mb-2">Datum: 27.6.2026</p>
              <p className="text-gray-400">České Velenice</p>
            </div>

            <div className="bg-stone-800/70 p-6 rounded-xl shadow-lg z-10">
              <h3 className="text-xl font-semibold mb-2 text-red-600">
                Svatba
              </h3>
              <p className="text-gray-300 mb-2">Datum: 8.8.2026</p>
              <p className="text-gray-400">Sušice</p>
            </div>
          </div>
        </section>
        
        {/* galerie */}
        <section id="Fotogalerie" className="py-20t text-white">
          <h2
            className="text-5xl text-stroke-2 brightness-85 font-bold font-orbitron text-center mb-12 sm:text-6xl md:text-7xl md:text-stroke-4 lg:text-8xl"
          >
            <span className="text-black">FO</span>
            <span className="text-[#D90000]">TOGRAFIE</span>
          </h2>

          <div className="relative max-w-7xl mx-auto px-4">
            {/* Buttons */}
            <button
              onClick={() => document.getElementById("galleryScroll")!.scrollBy({ left: -300, behavior: 'smooth' })}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/50 rounded-full hover:bg-black/70"
            >
              &#8592;
            </button>
            <button
              onClick={() => document.getElementById("galleryScroll")!.scrollBy({ left: 300, behavior: 'smooth' })}
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

        {/* Videa sectoin*/}
        <section id="Videa" className="relative py-20 text-white flex flex-col items-center">
          <h2
            className="text-5xl mx-10 text-stroke-2 brightness-85 font-bold font-orbitron text-center mb-12 sm:text-6xl md:text-7xl md:text-stroke-4 lg:text-8xl"
          >
            <span className="text-black">PO</span>
            <span className="text-[#D90000]">SLECHNI SI NÁS</span>
          </h2>
          <p className="mb-15 text-center text-xl px-10 text-stone-300">
            Mnoho ukázek našeho hraní naleznete na našem 
            <a className="font-bold text-stone-400 transition-colors duration-300 ease-in-out hover:text-[#D90000]" href="https://www.instagram.com/maly.veci.official?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="> Instagramu </a> a také na 
            <a className="font-bold text-stone-400 transition-colors duration-300 ease-in-out hover:text-[#D90000]" href="https://www.youtube.com/@Mal%C3%BDV%C4%9BciOfficial/videos"> YouTube</a>.
          </p>

          {/* Responsive iframe wrapper */}
          <div className="w-full max-w-3xl aspect-video">
            <iframe
              className="w-full h-full rounded-xl"
              src="https://www.youtube.com/embed/YCcMVXeO7a4?si=nwcPU8qz7tMOfBN6"
              title="Koncert Spinavy zada kapela"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          </div>
        </section>
        
        <section id="repertoar" className=" relative py-20 text-white flex flex-col items-center">
          <h2
            className="text-5xl text-stroke-2 brightness-85 font-bold font-orbitron text-center mb-12 sm:text-6xl md:text-7xl md:text-stroke-4 lg:text-8xl"
          >
            <span className="text-black">RE</span>
            <span className="text-[#D90000]">PERTOÁR</span>
          </h2>
          <p className="text-stone-300 text-lg mx-10 md:mx-40 text-center">
              Hrajeme pro radost – a pro všechny. Náš repertoár čítá přes 90 skladeb napříč žánry – od legendárních klasik až po současné hity. Hrajeme pomalu i rychle, česky i anglicky, vážně i s recesí, popově i rockově. Zkrátka – s námi se nudit rozhodně nebudete!  
              Pro zaslání kompletního repertoáru nebo přidání písní na přání nás prosím
          <a className="font-bold text-stone-400 transition-colors duration-300 ease-in-out hover:text-[#D90000]"href="#Kontakty"> kontaktujte.</a>
          </p>
            <div className="w-full max-w-6xl overflow-x-hidden mt-15">
              {/* Scrolling wrapper */}
              <div className="flex animate-scroll space-x-4 w-max">
                <iframe className="rounded-lg shadow-lg" src="https://open.spotify.com/embed/track/6wnc03soJZURZVtyAbK81X?utm_source=generator" width="300" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                <iframe className="rounded-lg shadow-lg" src="https://open.spotify.com/embed/track/5qYKPSKeZb83S0kFskJkPJ?utm_source=generator" width="300" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                <iframe className="rounded-lg shadow-lg" src="https://open.spotify.com/embed/track/7yy1E4CAVun8vq75NMQ6FD?utm_source=generator" width="300" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                <iframe className="rounded-lg shadow-lg" src="https://open.spotify.com/embed/track/6WfhZNzOioBmDUq4xb5kvz?utm_source=generator" width="300" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                <iframe className="rounded-lg shadow-lg" src="https://open.spotify.com/embed/track/3r6AJfqJ44FepL26lwLMPf?utm_source=generator" width="300" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                <iframe className="rounded-lg shadow-lg" src="https://open.spotify.com/embed/track/2IJftBfq7pJ43tfnOR0RB3?utm_source=generator" width="300" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                <iframe className="rounded-lg shadow-lg" src="https://open.spotify.com/embed/track/15tHagkk8z306XkyOHqiip?utm_source=generator" width="300" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                <iframe className="rounded-lg shadow-lg" src="https://open.spotify.com/embed/track/5vfjUAhefN7IjHbTvVCT4Z?utm_source=generator" width="300" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                <iframe className="rounded-lg shadow-lg" src="https://open.spotify.com/embed/track/273GBYX8ZWhlILVTWvQrS5?utm_source=generator" width="300" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                <iframe className="rounded-lg shadow-lg" src="https://open.spotify.com/embed/track/3k2mJZM0fdqDmW7GUbq2zs?utm_source=generator" width="300" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                <iframe className="rounded-lg shadow-lg" src="https://open.spotify.com/embed/track/29uKzagduhFDTWPCjqaGOg?utm_source=generator" width="300" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                <iframe className="rounded-lg shadow-lg" src="https://open.spotify.com/embed/track/4yKFAIgwISeVWcNnatlxx3?utm_source=generator" width="300" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                <iframe className="rounded-lg shadow-lg" src="https://open.spotify.com/embed/track/0jWgAnTrNZmOGmqgvHhZEm?utm_source=generator" width="300" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                <iframe className="rounded-lg shadow-lg" src="https://open.spotify.com/embed/track/2SiXAy7TuUkycRVbbWDEpo?utm_source=generator" width="300" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                <iframe className="rounded-lg shadow-lg" src="https://open.spotify.com/embed/track/0rmGAIH9LNJewFw7nKzZnc?utm_source=generator" width="300" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                <iframe className="rounded-lg shadow-lg" src="https://open.spotify.com/embed/track/4TIJ7zSBNejpoIPaWpWRKc?utm_source=generator" width="300" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                <iframe className="rounded-lg shadow-lg" src="https://open.spotify.com/embed/track/3SFXsFpeGmBTtQvKiwYMDA?utm_source=generator" width="300" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                <iframe className="rounded-lg shadow-lg" src="https://open.spotify.com/embed/track/36ypxavzIpdQffwmUboUCP?utm_source=generator" width="300" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                <iframe className="rounded-lg shadow-lg" src="https://open.spotify.com/embed/track/6K4r3XENOKeXFTKlBlAJLC?utm_source=generator" width="300" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
              </div>
            </div>
        </section>


        {/* Kontakty Section */}
        <section id="Kontakty" className=" relative py-20 text-stone-300">
          <h2
            className="text-5xl text-stroke-2 brightness-85 font-bold font-orbitron text-center mb-12 sm:text-6xl md:text-7xl md:text-stroke-4 lg:text-8xl "
          >
            <span className="text-black">KO</span>
            <span className="text-[#D90000]">NTAKTY</span>
          </h2>
          <div className="max-w-5xl mx-auto text-center px-4">
          <div className="grid sm:grid-cols-2 gap-6 max-w-xl mx-auto">
            <div className="bg-stone-800/70 p-6 rounded-xl shadow-lg text-center">
              <p className="text-sm uppercase text-gray-400">Email</p>
              <a href="mailto:malyveci.band@gmail.com" 
                className="text-[#D90000] text-lg font-semibold hover:underline">
                malyveci.band@gmail.com
              </a>
            </div>
            <div className="bg-stone-800/70 p-6 rounded-xl shadow-lg text-center">
              <p className="text-sm uppercase text-gray-400">Telefon</p>
              <a href="tel:+420774236616" 
                className="text-[#D90000] text-lg font-semibold hover:underline">
                +420 774 236 616
              </a>
            </div>
          </div>
            <div className=" w-full h-auto py-8 flex items-center justify-center gap-2 flex-wrap">
              <a href="https://www.facebook.com/share/1JLvMbwvA1/?mibextid=wwXIfr"
              className="p-2 rounded-lg flex items-center border border-gray-300 justify-center transition-all duration-500 hover:border-gray-100 hover:bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 71 72"
                fill="none">
                  <path
                    d="M46.4233 38.6403L47.7279 30.3588H39.6917V24.9759C39.6917 22.7114 40.8137 20.4987 44.4013 20.4987H48.1063V13.4465C45.9486 13.1028 43.7685 12.9168 41.5834 12.8901C34.9692 12.8901 30.651 16.8626 30.651 24.0442V30.3588H23.3193V38.6403H30.651V58.671H39.6917V38.6403H46.4233Z"
                    fill="#D90000" />
                </svg>
              </a>
              <a href="https://www.instagram.com/maly.veci.official?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              className="p-2 rounded-lg flex items-center border border-gray-300 justify-center transition-all duration-500 hover:border-gray-100 hover:bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 71 72"
                fill="none">
                  <path
                    d="M27.3762 35.7808C27.3762 31.1786 31.1083 27.4468 35.7132 27.4468C40.3182 27.4468 44.0522 31.1786 44.0522 35.7808C44.0522 40.383 40.3182 44.1148 35.7132 44.1148C31.1083 44.1148 27.3762 40.383 27.3762 35.7808ZM22.8683 35.7808C22.8683 42.8708 28.619 48.618 35.7132 48.618C42.8075 48.618 48.5581 42.8708 48.5581 35.7808C48.5581 28.6908 42.8075 22.9436 35.7132 22.9436C28.619 22.9436 22.8683 28.6908 22.8683 35.7808ZM46.0648 22.4346C46.0646 23.0279 46.2404 23.608 46.5701 24.1015C46.8997 24.595 47.3684 24.9797 47.9168 25.2069C48.4652 25.4342 49.0688 25.4939 49.6511 25.3784C50.2334 25.2628 50.7684 24.9773 51.1884 24.5579C51.6084 24.1385 51.8945 23.6041 52.0105 23.0222C52.1266 22.4403 52.0674 21.8371 51.8404 21.2888C51.6134 20.7406 51.2289 20.2719 50.7354 19.942C50.2418 19.6122 49.6615 19.436 49.0679 19.4358H49.0667C48.2708 19.4361 47.5077 19.7522 46.9449 20.3144C46.3821 20.8767 46.0655 21.6392 46.0648 22.4346ZM25.6072 56.1302C23.1683 56.0192 21.8427 55.6132 20.9618 55.2702C19.7939 54.8158 18.9606 54.2746 18.0845 53.4002C17.2083 52.5258 16.666 51.6938 16.2133 50.5266C15.8699 49.6466 15.4637 48.3214 15.3528 45.884C15.2316 43.2488 15.2073 42.4572 15.2073 35.781C15.2073 29.1048 15.2336 28.3154 15.3528 25.678C15.4639 23.2406 15.8731 21.918 16.2133 21.0354C16.668 19.8682 17.2095 19.0354 18.0845 18.1598C18.9594 17.2842 19.7919 16.7422 20.9618 16.2898C21.8423 15.9466 23.1683 15.5406 25.6072 15.4298C28.244 15.3086 29.036 15.2844 35.7132 15.2844C42.3904 15.2844 43.1833 15.3106 45.8223 15.4298C48.2612 15.5408 49.5846 15.9498 50.4677 16.2898C51.6356 16.7422 52.4689 17.2854 53.345 18.1598C54.2211 19.0342 54.7615 19.8682 55.2161 21.0354C55.5595 21.9154 55.9658 23.2406 56.0767 25.678C56.1979 28.3154 56.2221 29.1048 56.2221 35.781C56.2221 42.4572 56.1979 43.2466 56.0767 45.884C55.9656 48.3214 55.5573 49.6462 55.2161 50.5266C54.7615 51.6938 54.2199 52.5266 53.345 53.4002C52.4701 54.2738 51.6356 54.8158 50.4677 55.2702C49.5872 55.6134 48.2612 56.0194 45.8223 56.1302C43.1855 56.2514 42.3934 56.2756 35.7132 56.2756C29.033 56.2756 28.2432 56.2514 25.6072 56.1302ZM25.4001 10.9322C22.7371 11.0534 20.9174 11.4754 19.3282 12.0934C17.6824 12.7316 16.2892 13.5878 14.897 14.977C13.5047 16.3662 12.6502 17.7608 12.0116 19.4056C11.3933 20.9948 10.971 22.8124 10.8497 25.4738C10.7265 28.1394 10.6982 28.9916 10.6982 35.7808C10.6982 42.57 10.7265 43.4222 10.8497 46.0878C10.971 48.7494 11.3933 50.5668 12.0116 52.156C12.6502 53.7998 13.5049 55.196 14.897 56.5846C16.289 57.9732 17.6824 58.8282 19.3282 59.4682C20.9204 60.0862 22.7371 60.5082 25.4001 60.6294C28.0687 60.7506 28.92 60.7808 35.7132 60.7808C42.5065 60.7808 43.3592 60.7526 46.0264 60.6294C48.6896 60.5082 50.5081 60.0862 52.0983 59.4682C53.7431 58.8282 55.1373 57.9738 56.5295 56.5846C57.9218 55.1954 58.7745 53.7998 59.4149 52.156C60.0332 50.5668 60.4575 48.7492 60.5768 46.0878C60.698 43.4202 60.7262 42.57 60.7262 35.7808C60.7262 28.9916 60.698 28.1394 60.5768 25.4738C60.4555 22.8122 60.0332 20.9938 59.4149 19.4056C58.7745 17.7618 57.9196 16.3684 56.5295 14.977C55.1395 13.5856 53.7431 12.7316 52.1003 12.0934C50.5081 11.4754 48.6894 11.0514 46.0284 10.9322C43.3612 10.811 42.5085 10.7808 35.7152 10.7808C28.922 10.7808 28.0687 10.809 25.4001 10.9322Z"
                    fill="#D90000" />
                </svg></a>
              <a href="https://www.youtube.com/@Mal%C3%BDV%C4%9BciOfficial/videos"
                className="p-2 rounded-lg flex items-center border border-gray-300 justify-center transition-all duration-500 hover:border-gray-100 hover:bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 71 71"
                fill="none">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M56.5615 18.2428C58.8115 18.8504 60.58 20.6234 61.1778 22.8708C62.2654 26.9495 62.2654 35.4647 62.2654 35.4647C62.2654 35.4647 62.2654 43.98 61.1778 48.0586C60.5717 50.3144 58.8032 52.0873 56.5615 52.6866C52.4932 53.7771 36.1703 53.7771 36.1703 53.7771C36.1703 53.7771 19.8557 53.7771 15.7791 52.6866C13.5291 52.079 11.7606 50.306 11.1628 48.0586C10.0752 43.98 10.0752 35.4647 10.0752 35.4647C10.0752 35.4647 10.0752 26.9495 11.1628 22.8708C11.7689 20.615 13.5374 18.8421 15.7791 18.2428C19.8557 17.1523 36.1703 17.1523 36.1703 17.1523C36.1703 17.1523 52.4932 17.1523 56.5615 18.2428ZM44.5142 35.4647L30.9561 43.314V27.6154L44.5142 35.4647Z"
                  fill="#D90000" />
                </svg></a>
            </div>
          </div>
        </section>
        <section id="Kontakty" className=" relative text-center text-stone-300">
        <p className="text-[#D90000] text-sm">
          © {new Date().getFullYear()} Matouš Kovář. 
          Všechna práva vyhrazena.
        </p>
        </section>
      </main>
      <PosterModal posterSrc={poster} onClose={() => setPoster(null)} />
    </div>
  );
}
