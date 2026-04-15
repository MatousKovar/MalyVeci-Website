"use client";
import { events } from "@/lib/data"; // Import the data
import EventCard from "@/../components/ui/EventCard"; // Import the look
import { Calendar } from "@/../components/ui/calendar";
import { useState } from "react";


/**Defining data type of input function to EventsSection. Function is passed poster_location and shows popup. Defined in page.tsx */
type EventsSectionProps = {
  showPosterFunction: (src: string) => void;
};


export default function EventsSection({
  showPosterFunction,
}: EventsSectionProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return (
    <section id="Akce" className="py-20 text-center bg-black z-100">
      <h2 className="brightness-85 text-6xl text-stroke-2 font-bold font-orbitron text-center mb-12 sm:text-7xl md:text-7xl md:text-stroke-4 lg:text-8xl">
        <span className="text-black">A</span>
        <span className="text-[#D90000]">KCE</span>
      </h2>
      <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-lg border"
      captionLayout="dropdown"
    />
      
    </section>
  );
}
