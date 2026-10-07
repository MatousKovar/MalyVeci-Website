import React from "react";
import type { Event } from "@/lib/events";

interface EventCardProps extends Event {
  showPosterFunction: (src: string) => void;
}

export default function EventCard({
  title,
  date,
  location,
  posterPath,
  showPosterFunction, // <--- Receive the function here
}: EventCardProps) {
  return (
    <div className="bg-stone-800/70 p-6 rounded-xl shadow-lg z-10 hover:scale-105 transition-transform duration-300 flex flex-col justify-between hover:scale-105">
      <div>
        <h3 className="text-xl font-semibold mb-2 text-red-600">{title}</h3>
        <p className="text-gray-300 mb-2">Datum: {date}</p>
        <p className="text-gray-400">{location}</p>
      </div>

      {posterPath && (
        <button
          onClick={() => showPosterFunction(posterPath)}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors w-full sm:w-auto"
        >
          Zobrazit plakát
        </button>
      )}
    </div>
  );
}
