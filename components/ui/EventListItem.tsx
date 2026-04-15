"use client";

import React, { useState, useEffect } from "react";
import { Event } from "@/lib/data";

interface EventListItemProps extends Event {
  showPosterFunction: (src: string) => void;
  isHighlighted?: boolean; // Přidáno pro možnost zvýraznění
}

export default function EventListItem({
  title,
  date,
  location,
  poster_location,
  description,
  showPosterFunction,
isHighlighted = false,
}: EventListItemProps) {
  // Stav pro sledování, zda je detail akce rozbalený
  const [isExpanded, setIsExpanded] = useState(false);

  const dateObj = new Date(date);
  const day = !isNaN(dateObj.getDate()) ? dateObj.getDate() : "??";
  const month = !isNaN(dateObj.getMonth())
    ? dateObj.toLocaleString("cs-CZ", { month: "short" }).replace(".", "")
    : "";

  const fullDateCzech = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("cs-CZ", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : date; 

    useEffect(() => {
    if (isHighlighted) {
      setIsExpanded(true);
    }
  }, [isHighlighted]); // Tento kód se spustí vždy, když se změní hodnota isHighlighted
  return (
    
    <div id={date} className={`group flex flex-col bg-transparent hover:bg-stone-900/60 transition-all duration-1000 ${
        isHighlighted 
          ? "border-l-4 border-l-[#D90000] border-b border-b-stone-800 bg-[#D90000]/10" 
          : "border-l-4 border-l-transparent border-b border-b-stone-800"
      }`}>
      
      {/* HLAVNÍ ŘÁDEK (Kliknutím na něj se rozbalí/sbalí detail) */}
      <div 
        className="flex flex-row items-center p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* LEVÁ ČÁST: Velké datum a měsíc */}
        <div className="flex flex-col items-center justify-center w-16 shrink-0 border-r border-stone-800/50 pr-4">
          <span className="text-3xl font-bold text-white group-hover:text-[#D90000] transition-colors font-orbitron">
            {day}
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-stone-500 mt-1">
            {month}
          </span>
        </div>

        {/* STŘEDNÍ ČÁST: Název a lokace */}
        <div className="flex flex-col sm:flex-row flex-grow justify-between sm:items-center ml-6 gap-1">
          <h3 className="text-lg font-semibold text-stone-200">{title}</h3>
          <p className="text-sm text-stone-400">{location}</p>
        </div>

        <div className="ml-4 shrink-0 flex items-center">
          <svg 
            className={`w-5 h-5 text-stone-500 group-hover:text-white transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            {/* Standardní šipka dolů */}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* ROZBALOVACÍ DETAIL (Zobrazí se jen když isExpanded === true) */}
      {isExpanded && (
        <div className="pl-[88px] pr-4 pb-5 pt-1">
          <div className="mb-4">
            <h4 className="text-md font-bold text-white mb-1">{title}</h4>
            <p className="text-xs text-[#D90000] font-semibold uppercase tracking-wider mb-2">
              {fullDateCzech}
            </p>
            <p className="text-sm text-stone-400 leading-relaxed">
              {description || "Více informací o této akci brzy doplníme."}
            </p>
          </div>

          {poster_location && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Zabrání tomu, aby se po kliknutí na tlačítko zároveň zavřel ten dropdown
                showPosterFunction(poster_location);
              }}
              className="bg-stone-800 text-stone-200 px-5 py-2 text-sm font-bold rounded hover:bg-[#D90000] hover:text-white transition-colors duration-300"
            >
              Ukázat plakát
            </button>
          )}
        </div>
      )}
      
    </div>
  );
}