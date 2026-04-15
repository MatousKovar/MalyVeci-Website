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
      <div id="calendar_wrapper" className="grid grid-cols-1 md:grid-cols-2 mx-auto max-w-7xl px-4 gap-8">

        <div className="flex justify-center md:justify-end">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            // Vracím sem i tmavé styly, aby to ladilo s webem
            className="rounded-lg border bg-stone-900/50 text-white border-stone-800 w-fit"
            captionLayout="dropdown"
          />
        </div>

        {/* Pravý sloupec: Místo pro budoucí seznam akcí */}
        <div className="flex flex-col border border-stone-800 rounded-lg p-6 bg-stone-900/50 text-white">
          <h3 className="text-xl font-bold text-[#D90000] mb-4">Vybrané akce</h3>
          <p className="text-stone-400 z-10">Zatím tu nic není, ale sem později napojíme vyfiltrovaný seznam z data.ts.</p>
        </div>

      </div>
      
    </section>
  );
}
