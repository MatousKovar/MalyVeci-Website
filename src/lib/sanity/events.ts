import { getSanityClient } from "@/lib/sanity/client";
import type { Event } from "@/lib/events";

const eventsQuery = `*[_type == "event" && defined(date)] | order(date asc) {
  title,
  date,
  location,
  description,
  "poster_location": poster.asset->url
}`;

function toEvent(value: unknown): Event | undefined {
  if (typeof value !== "object" || value === null) return undefined;

  const event = value as Record<string, unknown>;
  if (
    typeof event.title !== "string" ||
    typeof event.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(event.date) ||
    typeof event.location !== "string" ||
    (event.description != null && typeof event.description !== "string") ||
    (event.poster_location != null && typeof event.poster_location !== "string")
  ) {
    return undefined;
  }

  return {
    title: event.title,
    date: event.date,
    location: event.location,
    ...(typeof event.description === "string"
      ? { description: event.description }
      : {}),
    ...(typeof event.poster_location === "string"
      ? { poster_location: event.poster_location }
      : {}),
  };
}

export async function fetchEvents(): Promise<Event[]> {
  const client = getSanityClient();
  const events = await client.fetch<unknown[]>(eventsQuery);
  return events.flatMap((event) => {
    const parsedEvent = toEvent(event);
    return parsedEvent ? [parsedEvent] : [];
  });
}
