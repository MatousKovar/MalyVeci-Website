import { getSanityWriteClient } from "@/lib/sanity/client";
import type {
  EventCreateFields,
  EventUpdateFields,
} from "@/lib/admin/event-update.mjs";

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
