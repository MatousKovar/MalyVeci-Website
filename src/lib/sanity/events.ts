import { getSanityClient, getSanityWriteClient } from "@/lib/sanity/client";
import type { Event, ManagedEvent } from "@/lib/events";
import type {
  EventCreateFields,
  EventUpdateFields,
} from "@/lib/admin/event-update.mjs";

const eventsQuery = `*[_type == "event" && defined(date)] | order(date asc) {
  "id": _id,
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

function toManagedEvent(value: unknown): ManagedEvent | undefined {
  if (typeof value !== "object" || value === null) return undefined;

  const event = value as Record<string, unknown>;
  const parsedEvent = toEvent(event);
  if (!parsedEvent || typeof event.id !== "string") return undefined;

  return { id: event.id, ...parsedEvent };
}

export async function fetchEvents(): Promise<ManagedEvent[]> {
  const client = getSanityClient().withConfig({ useCdn: false });
  const events = await client.fetch<unknown[]>(eventsQuery);
  return events.flatMap((event) => {
    const parsedEvent = toManagedEvent(event);
    return parsedEvent ? [parsedEvent] : [];
  });
}

const eventByIdQuery = `*[_type == "event" && _id == $id][0]{_id, date}`;
const otherEventOnDateQuery = `*[_type == "event" && date == $date && _id != $excludedId][0]{_id}`;

export async function findSanityEventById(id: string) {
  const client = getSanityWriteClient();
  const event = await client.fetch<{ _id: string; date: string } | null>(
    eventByIdQuery,
    { id },
  );

  return event ? { id: event._id, date: event.date } : undefined;
}

export async function findOtherSanityEventOnDate(
  date: string,
  excludedId: string,
) {
  const client = getSanityWriteClient();
  const event = await client.fetch<{ _id: string } | null>(
    otherEventOnDateQuery,
    { date, excludedId },
  );

  return event ? { id: event._id } : undefined;
}

export async function updateSanityEvent(id: string, fields: EventUpdateFields) {
  const client = getSanityWriteClient();
  const patch = client.patch(id).set({
    title: fields.title,
    date: fields.date,
    location: fields.location,
  });

  if (fields.description === null) {
    patch.unset(["description"]);
  } else {
    patch.set({ description: fields.description });
  }

  await patch.commit();
}

export async function createSanityEvent(fields: EventCreateFields) {
  const document = await getSanityWriteClient().create({
    _type: "event",
    title: fields.title,
    date: fields.date,
    location: fields.location,
    ...(fields.description ? { description: fields.description } : {}),
  });

  return document._id;
}

export async function deleteSanityEvent(id: string) {
  await getSanityWriteClient().delete(id);
}
