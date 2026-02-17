import React from "react";
import { Event } from "@/lib/data";

interface EventCardProps extends Event {
  showPosterFunction: (src: string) => void;
}

export default function EventCard({
  title,
  date,
  location,
  poster_location,
  showPosterFunction, // <--- Receive the function here
}: EventCardProps) {
  return (
    <div className="bg-stone-800/70 p-6 rounded-xl shadow-lg z-10 hover:scale-105 transition-transform duration-300 flex flex-col justify-between hover:scale-105">
      <div>
        <h3 className="text-xl font-semibold mb-2 text-red-600">{title}</h3>
        <p className="text-gray-300 mb-2">Datum: {date}</p>
        <p className="text-gray-400">{location}</p>
      </div>

      {poster_location && (
        <button
          onClick={() => showPosterFunction(poster_location)}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors w-full sm:w-auto"
        >
          Zobrazit plakát
        </button>
      )}
    </div>
  );
}
