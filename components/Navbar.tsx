"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ArrowUpRight, Menu, X } from "lucide-react";

const desktopLinks = ["O nás", "Akce", "Fotogalerie", "Videa", "Kontakty", "Repertoár"];
const mobileLinks = ["Akce", "O nás", "Fotogalerie", "Videa", "Repertoár", "Kontakty"];

function sectionHref(label: string) {
  return `#${label === "O nás" ? "onas" : label === "Repertoár" ? "repertoar" : label}`;
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const selectedSectionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!mobileOpen) return;

    const dialog = dialogRef.current;
    if (!dialog) return;
    const menuButton = menuButtonRef.current;

    const desktop = window.matchMedia("(min-width: 640px)");
    if (desktop.matches) {
      setMobileOpen(false);
      return;
    }

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const bodyStyle = document.body.style.cssText;
    const rootOverflow = document.documentElement.style.overflow;

    Object.assign(document.body.style, {
      position: "fixed",
      top: `-${scrollY}px`,
      left: `-${scrollX}px`,
      width: "100%",
      overflow: "hidden",
    });
    document.documentElement.style.overflow = "hidden";
    dialog.showModal();
    closeButtonRef.current?.focus();

    const closeOnDesktop = () => {
      if (desktop.matches) setMobileOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);

    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      dialog.close();
      document.body.style.cssText = bodyStyle;
      document.documentElement.style.overflow = rootOverflow;
      window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
      menuButton?.focus({ preventScroll: true });

      const section = selectedSectionRef.current;
      selectedSectionRef.current = null;
      if (!section) return;

      const target = document.getElementById(section);
      if (!target) return;

      window.history.pushState(null, "", `#${section}`);
      window.scrollTo({
        top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - 64),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    };
  }, [mobileOpen]);

  function selectSection(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    selectedSectionRef.current = event.currentTarget.hash.slice(1);
    setMobileOpen(false);
  }

  return (
    <>
      <nav aria-label="Hlavní navigace" className="fixed w-full top-0 z-50 bg-black/30 backdrop-blur-md text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center">
            <div className="hidden flex-1 items-center space-x-8 sm:flex">
              <Image src="/mvmaly.png" alt="Logo" width={30} height={30} className="object-contain" />
              {desktopLinks.map((link) => (
                <a key={link} href={sectionHref(link)} className="text-lg font-medium font-orbitron tracking-wide px-3 py-2 rounded-md transition-colors duration-300 text-stone-300 hover:text-[#D90000]">
                  {link}
                </a>
              ))}
            </div>
            <a href="/admin" className="ml-auto hidden shrink-0 items-center whitespace-nowrap rounded-md border border-stone-500/70 px-3 py-2 text-sm font-medium tracking-wide text-stone-300 transition-colors hover:border-[#D90000] hover:text-[#D90000] sm:inline-flex">
              Správa webu
            </a>
            <div className="flex w-full items-center justify-between gap-4 sm:hidden">
              <div className="flex items-center gap-2">
                <Image src="/mvmaly.png" alt="" width={32} height={32} className="object-contain" />
                <span className="font-orbitron text-sm">Malý Věci</span>
              </div>
              <button ref={menuButtonRef} type="button" onClick={() => setMobileOpen(true)} aria-expanded={mobileOpen} aria-controls="mobile-navigation" aria-haspopup="dialog" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-600 bg-stone-900 px-3 text-sm text-stone-100 hover:border-[#D90000] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500">
                Menu <Menu size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      {mobileOpen && createPortal(
        <dialog ref={dialogRef} id="mobile-navigation" aria-label="Menu Malý Věci" onCancel={() => setMobileOpen(false)} onClose={() => setMobileOpen(false)} onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const items = event.currentTarget.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>("a, button");
          const first = items[0];
          const last = items[items.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }} className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 border-t-4 border-[#D90000] bg-[#0b0b0c] p-0 text-stone-100 backdrop:bg-black/80">
          <div className="flex h-full flex-col pt-[env(safe-area-inset-top)]">
            <header className="flex min-h-18 shrink-0 items-center justify-between gap-3 border-b border-stone-800 px-5 py-3">
              <div className="flex items-center gap-2">
                <Image src="/mvmaly.png" alt="" width={32} height={32} className="object-contain" />
                <span className="font-orbitron text-sm">Malý Věci</span>
              </div>
              <button ref={closeButtonRef} type="button" onClick={() => setMobileOpen(false)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-600 bg-stone-900 px-3 text-sm hover:border-[#D90000] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500">
                Zavřít <X size={18} aria-hidden="true" />
              </button>
            </header>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-6 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-stone-400">Kam to bude?</p>
              <nav aria-label="Mobilní navigace">
                {mobileLinks.map((link) => (
                  <a key={link} href={sectionHref(link)} onClick={selectSection} className={`flex min-h-16 items-center justify-between gap-3 border-b border-stone-800 py-3 font-orbitron text-[clamp(1.25rem,6vw,1.5rem)] leading-snug break-words transition-colors hover:bg-stone-900 hover:text-[#ff4b3c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 ${link === "Akce" ? "text-[#ff4b3c]" : "text-stone-100"}`}>
                    <span className="min-w-0">{link}</span><ArrowUpRight size={22} aria-hidden="true" className={`shrink-0 ${link === "Akce" ? "text-[#ff4b3c]" : "text-stone-500"}`} />
                  </a>
                ))}
              </nav>
              <div className="mt-auto pt-6">
                <a href="#Kontakty" onClick={selectSection} className="flex min-h-13 items-center justify-between gap-3 rounded-lg bg-[#D90000] px-4 py-3 font-medium text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500">
                  Chci vás na akci <ArrowUpRight size={20} aria-hidden="true" className="shrink-0" />
                </a>
                <div className="flex flex-wrap items-center justify-between gap-x-3 pt-2 text-xs text-stone-400">
                  <a href="/admin" className="inline-flex min-h-11 items-center text-stone-300 underline underline-offset-4 hover:text-white">Správa webu</a>
                </div>
              </div>
            </div>
          </div>
        </dialog>,
        document.body,
      )}
    </>
  );
}
