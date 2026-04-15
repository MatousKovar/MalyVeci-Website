"use client";
import { events } from "@/lib/data"; // Import the data
import EventCard from "@/../components/ui/EventCard"; // Import the look
import { Calendar } from "@/../components/ui/calendar";
import { useState, useRef } from "react"; // Přidán useRef, pokud by bylo potřeba, ale vystačíme si s useState
import EventListItem from "../ui/EventListItem";
import { format } from "date-fns/format";


/**Defining data type of input function to EventsSection. Function is passed poster_location and shows popup. Defined in page.tsx */
type EventsSectionProps = {
  showPosterFunction: (src: string) => void;
};


export default function EventsSection({
  showPosterFunction,
}: EventsSectionProps) {

  const [date, setDate] = useState<Date | undefined>(new Date());

  // logika pro propojeni kalendare s listem vpravo
  const eventDates = events.map(event => new Date(event.date));
  const handleDateSelect = (selectedDate: Date | undefined) => {
  setDate(selectedDate);
  
  if (selectedDate) {
    const dateId = format(selectedDate, "yyyy-MM-dd");
    const element = document.getElementById(dateId);
    
    if (element) {
      element.scrollIntoView({ 
        behavior: "smooth", 
        block: "nearest" 
      });
    }
  }
};

  return (
    <section id="Akce" className="py-20 text-center bg-black z-100">
      <h2 className="brightness-85 text-6xl text-stroke-2 font-bold font-orbitron text-center mb-12 sm:text-7xl md:text-7xl md:text-stroke-4 lg:text-8xl">
        <span className="text-black">A</span>
        <span className="text-[#D90000]">KCE</span>
      </h2>
      <div id="calendar_wrapper" className="grid grid-cols-1 md:grid-cols-2 mx-auto max-w-7xl px-4 gap-8">

        <div className="flex justify-center hidden md:flex md:justify-end">
          <Calendar
            mode="single"
            weekStartsOn={1}
            selected={date}
            onSelect={handleDateSelect}
            // Vracím sem i tmavé styly, aby to ladilo s webem
            className="rounded-lg border bg-stone-900/30 text-white border-stone-800 w-full h-full"
            captionLayout="dropdown"
            modifiers={{ event: eventDates }}
            // Styly pro tento modifier (tečka pod číslem)
            modifiersClassNames={{
              event: "relative after:absolute after:bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:z-10 after:h-1.5 after:bg-[#D90000] after:rounded-full"
            }}
          />
        </div>

        <div className="flex flex-col border border-stone-800 rounded-lg p-6 bg-stone-900/50 text-white md:justify-start">
          <div className="flex flex-col max-h-[500px] overflow-y-auto custom-scrollbar z-10">
          {events.length > 0 ? (
            events.map((event, index) => (
              <EventListItem
                key={index}
                title={event.title}
                date={event.date}
                location={event.location}
                poster_location={event.poster_location}
                description={event.description}
                showPosterFunction={showPosterFunction}
              />
            ))
          ) : (
            <p className="p-6 text-stone-500 italic">
              Zatím tu nejsou žádné naplánované akce.
            </p>
          )}          
        </div>

        </div>
      </div>
      
    </section>
  );
}
