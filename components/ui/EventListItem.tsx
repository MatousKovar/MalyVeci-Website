import React from "react";
import { Event } from "@/lib/data";

interface EventListItemProps extends Event {
  showPosterFunction: (src: string) => void;
}

export default function EventListItem({
  title,
  date,
  location,
  poster_location,
  description,
  showPosterFunction,
}: EventListItemProps) {
  // Rozsekání data na den a zkrácený český měsíc (např. "20" a "kvě")
  const dateObj = new Date(date);
  const day = !isNaN(dateObj.getDate()) ? dateObj.getDate() : "??";
  const month = !isNaN(dateObj.getMonth())
    ? dateObj.toLocaleString("cs-CZ", { month: "short" }).replace(".", "")
    : "";

  return (
    <div className="group flex flex-row items-center p-4 border-b border-stone-800 bg-transparent hover:bg-stone-900/60 transition-colors duration-300">
      
      <div className="flex flex-col items-center justify-center w-16 shrink-0 border-r border-stone-800/50 pr-4">
        <span className="text-3xl font-bold text-white group-hover:text-[#D90000] transition-colors font-orbitron">
          {day}
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-stone-500 mt-1">
          {month}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row flex-grow justify-between sm:items-center ml-6 gap-1">
        <h3 className="text-lg font-semibold text-stone-200">{title}</h3>
        <p className="text-sm text-stone-400">{location}</p>
      </div>

      <div className="ml-4 shrink-0">
        {poster_location && (
          <button
            onClick={() => showPosterFunction(poster_location)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-stone-400 hover:text-white border border-stone-700 hover:border-[#D90000] rounded-full transition-all"
          >
            Plakát
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}