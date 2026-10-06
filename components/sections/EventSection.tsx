"use client";
import { Calendar } from "@/../components/ui/calendar";
import { useState } from "react";
import EventListItem from "../ui/EventListItem";
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import { cs } from "date-fns/locale";
import type { ManagedEvent } from "@/lib/events";
import EventEditor from "@/app/admin/EventEditor";


/**Defining data type of input function to EventsSection. Function is passed poster_location and shows popup. Defined in page.tsx */
type EventsSectionProps = {
  events: ManagedEvent[];
  hasError: boolean;
  isAdmin: boolean;
  showPosterFunction: (src: string) => void;
};


export default function EventsSection({
  events,
  hasError,
  isAdmin,
  showPosterFunction,
}: EventsSectionProps) {

  const [date, setDate] = useState<Date | undefined>(new Date());

  const [highlightedDate, setHighlightedDate] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // logika pro propojeni kalendare s listem vpravo
  const eventDates = events.map((event) => parseISO(event.date));
  const handleDateSelect = (selectedDate: Date | undefined) => {
  setDate(selectedDate);
  
  if (selectedDate) {
    const dateId = format(selectedDate, "yyyy-MM-dd");
    const element = document.querySelector<HTMLElement>(
      `[data-event-date="${dateId}"]`,
    );
    
    if (element) {
      element.scrollIntoView({ 
        behavior: "smooth", 
        block: "nearest" 
      });

      setHighlightedDate(dateId);

      setTimeout(() => {
          setHighlightedDate(null);
        }, 4000);
    }
  }
};

  return (
    <section id="Akce" className="py-20 text-center bg-black z-100">
      <div className="mb-12 flex flex-col items-center gap-5">
        <h2 className="brightness-85 text-6xl text-stroke-2 font-bold font-orbitron text-center sm:text-7xl md:text-7xl md:text-stroke-4 lg:text-8xl">
          <span className="text-black">A</span>
          <span className="text-[#D90000]">KCE</span>
        </h2>
        {isAdmin && (
          <button
            type="button"
            aria-expanded={isEditorOpen}
            onClick={() => setIsEditorOpen((open) => !open)}
            className="rounded-md border border-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Upravit akce
          </button>
        )}
      </div>
      {isAdmin && isEditorOpen && (
        <EventEditor events={events} onClose={() => setIsEditorOpen(false)} />
      )}
      <div id="calendar_wrapper" className="grid grid-cols-1 md:grid-cols-2 mx-auto max-w-7xl px-4 gap-8">

        <div className="flex justify-center hidden md:flex md:justify-end">
          <Calendar
            mode="single"
            weekStartsOn={1}
            selected={date}
            onSelect={handleDateSelect}
            locale={cs}
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
          {hasError ? (
            <p className="p-6 text-stone-300" role="alert">
              Akce se nepodařilo načíst. Zkuste to prosím později.
            </p>
          ) : events.length > 0 ? (
            events.map((event) => {
              const eventKey = `${event.date}-${event.title}-${event.location}`;
              return (
                <EventListItem
                  key={eventKey}
                  title={event.title}
                  date={event.date}
                  location={event.location}
                  poster_location={event.poster_location}
                  description={event.description}
                  showPosterFunction={showPosterFunction}
                  isHighlighted={highlightedDate === event.date}
                />
              );
            })
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
