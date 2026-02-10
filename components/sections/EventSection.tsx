import { events } from "@/lib/data"; // Import the data
import EventCard from "@/components/ui/EventCard"; // Import the look


/**
 * TODO
 * @returns 
 */
export default function EventsSection() {
  return (
    <section id="Akce" className="py-20 text-center bg-black z-100">
       {/* ... Title ... */}
       
      <div className="max-w-4xl mx-auto mx-10 grid md:grid-cols-2 gap-8 px-4">
        {/* THIS REPLACES ALL YOUR COPY-PASTED DIVS */}
        {events.map((event, index) => (
          <EventCard 
            key={index}
            title={event.title}
            date={event.date}
            location={event.location}
          />
        ))}
      </div>
    </section>
  );
}