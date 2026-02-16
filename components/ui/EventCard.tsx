import React from "react";
import { Event } from "@/lib/data"

export default function EventCard({ title, date, location, poster_location }: Event) {  
  return (
    <div className="bg-stone-800/70 p-6 rounded-xl shadow-lg z-10 hover:scale-105 transition-transform duration-300">
      <h3 className="text-xl font-semibold mb-2 text-red-600">
        {title}
      </h3>
      <p className="text-gray-300 mb-2">Datum: {date}</p>
      <p className="text-gray-400">{location}</p>
      <button
              onClick={() => setPoster("/jinin2.png")}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
              Zobrazit plakát
              </button>
    </div>
  );
}