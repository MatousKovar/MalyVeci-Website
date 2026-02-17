import Image, { StaticImageData } from "next/image";
import uvodka from "@/../public/uvodka.jpg";
import heroImg from "@/../public/logomv.png"; 
import heroImgMobile from "@/../public/uvodka_mobil.jpeg";


type HeroImageProps = {blur: number}

export default function HeroImageSection({blur}: HeroImageProps){
    return(
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
)};
