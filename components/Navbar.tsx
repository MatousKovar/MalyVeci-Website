'use client'
import { useState } from 'react';
import Image from 'next/image';
import mvmaly from "/mvmaly.png";

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const links = ['O nás', 'Akce', 'Fotogalerie', 'Videa', 'Kontakty', "Repertoár"];

    return (
      <nav className="fixed w-full top-0 z-50 bg-black/30 backdrop-blur-md text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            
  
            {/* Desktop menu */}
            <div className="hidden sm:flex items-center space-x-8">
              <Image
                src="/mvmaly.png" // path to your logo (in /public/logo.png)
                alt="Logo"
                width={30} // adjust size
                height={30}
                className="object-contain"
              />
              {links.map((link) => (
                <a
                  key={link}
                  href={`#${
                    link === "O nás"
                      ? "onas"
                      : link === "Repertoár"
                      ? "repertoar"
                      : link
                  }`}
                  className="text-lg font-medium font-orbitron tracking-wide px-3 py-2 rounded-md transition-colors duration-300 text-stone-300 hover:text-[#D90000]"
                >
                  {link}
                </a>
              ))}
            </div>
            <a
              href="/admin"
              className="hidden sm:inline-flex shrink-0 items-center whitespace-nowrap text-sm font-medium tracking-wide text-stone-400 transition-colors hover:text-[#D90000]"
            >
              Správa webu
            </a>
  
            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center justify-between w-full px-4">              
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#D90000]"
              >
                {mobileOpen ? (
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
              <Image
                src="/mvmaly.png" // path to your logo (in /public/logo.png)
                alt="Logo"
                width={30} // adjust size
                height={30}
                className="object-contain"
              />

            </div>
          </div>
        </div>
  
        {mobileOpen && (
        <div className="sm:hidden fixed inset-0 top-16 z-50 bg-black/30 backdrop-blur-md top-16 left-0 w-full ">
            <div className="px-4 pt-6 space-y-4 bg-black/40">
            {links.map((link) => (
                <a
                key={link}
                href={`#${
                  link === "O nás"
                    ? "onas"
                    : link === "Repertoár"
                    ? "repertoar"
                    : link
                }`}
                className="font-bold block px-3 py-2 rounded-md text-lg font-medium text-gray-300 hover:text-[#D90000] hover:bg-white/10"
                onClick={() => setMobileOpen(false)}
                >
                {link}
                </a>
            ))}
            <a
              href="/admin"
              className="font-bold block px-3 py-2 rounded-md text-lg text-gray-300 hover:text-[#D90000] hover:bg-white/10"
              onClick={() => setMobileOpen(false)}
            >
              Správa webu
            </a>
            </div>
        </div>
        )}
      </nav>
    );
  }
