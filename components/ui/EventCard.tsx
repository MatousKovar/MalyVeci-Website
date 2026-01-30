import React from "react";

type EventProps = {
  title: string;
  date: string;
  location: string;
};

export default function EventCard({ title, date, location }: EventProps) {  
  return (
    <div className="bg-stone-800/70 p-6 rounded-xl shadow-lg z-10 hover:scale-105 transition-transform duration-300">
      <h3 className="text-xl font-semibold mb-2 text-red-600">
        {title}
      </h3>
      <p className="text-gray-300 mb-2">Datum: {date}</p>
      <p className="text-gray-400">{location}</p>
    </div>
  );
}