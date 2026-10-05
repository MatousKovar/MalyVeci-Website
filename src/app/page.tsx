import HomePage from "@/app/HomePage";
import type { Event } from "@/lib/events";
import { fetchEvents } from "@/lib/sanity/events";

export const revalidate = 60;

export default async function Home() {
  let events: Event[] = [];
  let eventsError = false;

  try {
    events = await fetchEvents();
  } catch (error) {
    eventsError = true;
    console.error(
      "Failed to load events from Sanity:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  return <HomePage events={events} eventsError={eventsError} />;
}
