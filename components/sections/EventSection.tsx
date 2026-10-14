"use client";
import { Calendar } from "@/../components/ui/calendar";
import { useEffect, useState } from "react";
import { TZDate } from "react-day-picker";
import EventListItem from "../ui/EventListItem";
import { cs } from "date-fns/locale";
import type { ManagedEvent } from "@/lib/events";
import EventEditor from "@/app/admin/EventEditor";
import { getTodayInPrague } from "@/lib/admin/event-update.mjs";

function calendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new TZDate(year, month - 1, day, "Europe/Prague");
}


type EventsSectionProps = {
  events: ManagedEvent[];
  errors: string[];
  isAdmin: boolean;
  today: string;
  showPosterFunction: (src: string) => void;
};


export default function EventsSection({
  events,
  errors,
  isAdmin,
  today,
  showPosterFunction,
}: EventsSectionProps) {

  const [currentToday, setCurrentToday] = useState(today);
  const todayDate = calendarDate(currentToday);
  const [date, setDate] = useState<Date | undefined>(() => calendarDate(today));
  const [month, setMonth] = useState<Date>(() => calendarDate(today));

  useEffect(() => {
    const updateToday = () => setCurrentToday(getTodayInPrague());
    updateToday();
    const interval = window.setInterval(updateToday, 30_000);
    window.addEventListener("focus", updateToday);
    document.addEventListener("visibilitychange", updateToday);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", updateToday);
      document.removeEventListener("visibilitychange", updateToday);
    };
  }, []);

  const [highlightedDate, setHighlightedDate] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // logika pro propojeni kalendare s listem vpravo
  const upcomingEvents = events.filter((event) => event.date >= currentToday);
  const eventDates = upcomingEvents.map((event) => calendarDate(event.date));
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined);
      return;
    }
    const dateId = getTodayInPrague(selectedDate);
    if (dateId < getTodayInPrague()) return;
    setDate(selectedDate);

    const element = document.querySelector<HTMLElement>(
      `[data-event-date="${dateId}"]`,
    );

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });

      setHighlightedDate(dateId);

      setTimeout(() => {
        setHighlightedDate(null);
      }, 4000);
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
            Spravovat akce
          </button>
        )}
      </div>
      {isAdmin && isEditorOpen && (
        <EventEditor
          events={events}
          today={currentToday}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
      <div id="calendar_wrapper" className="grid grid-cols-1 md:grid-cols-2 mx-auto max-w-7xl px-4 gap-8">

        <div className="flex justify-center hidden md:flex md:justify-end">
          <Calendar
            mode="single"
            weekStartsOn={1}
            timeZone="Europe/Prague"
            today={todayDate}
            month={getTodayInPrague(month).slice(0, 7) < currentToday.slice(0, 7) ? todayDate : month}
            onMonthChange={setMonth}
            startMonth={todayDate}
            disabled={{ before: todayDate }}
            selected={date && getTodayInPrague(date) >= currentToday ? date : undefined}
            onSelect={handleDateSelect}
            locale={cs}
            // Vracím sem i tmavé styly, aby to ladilo s webem
            className="rounded-lg border bg-stone-900/30 text-white border-stone-800 w-full h-full"
            captionLayout="dropdown"
            classNames={{ disabled: "text-stone-500 opacity-50 [&_button]:cursor-not-allowed" }}
            modifiers={{ event: eventDates }}
            // Styly pro tento modifier (tečka pod číslem)
            modifiersClassNames={{
              event: "relative after:absolute after:bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:z-10 after:h-1.5 after:bg-[#D90000] after:rounded-full"
            }}
          />
        </div>

        <div className="flex flex-col border border-stone-800 rounded-lg p-6 bg-stone-900/50 text-white md:justify-start">
          <div className="flex flex-col max-h-[500px] overflow-y-auto custom-scrollbar z-10">
          {errors.length > 0 && (
            <div className="p-4 text-left text-sm text-red-200" role="alert">
              <p>Některé akce se nepodařilo načíst:</p>
              <ul className="mt-2 list-disc pl-5">
                {errors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            </div>
          )}
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => {
              return (
                <EventListItem
                  key={event.id}
                  title={event.title}
                  date={event.date}
                  location={event.location}
                  posterPath={event.posterPath}
                  description={event.description}
                  showPosterFunction={showPosterFunction}
                  isHighlighted={highlightedDate === event.date}
                />
              );
            })
          ) : errors.length === 0 ? (
            <p className="p-6 text-stone-500 italic">
              Zatím tu nejsou žádné naplánované akce.
            </p>
          ) : (
            <p className="p-6 text-stone-500 italic">Není dostupná žádná platná akce.</p>
          )}
        </div>

        </div>
      </div>
      
    </section>
  );
}
