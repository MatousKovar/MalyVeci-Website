"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ManagedEvent } from "@/lib/events";
import { updateEvent } from "./actions";

type EventEditorProps = {
  events: ManagedEvent[];
  today: string;
  onClose: () => void;
};

type EventFields = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
};

const initialState = { status: "idle" } as const;
const nonWhitespacePattern = String.raw`.*\S.*`;

function getFields(event: ManagedEvent): EventFields {
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    location: event.location,
    description: event.description ?? "",
  };
}

function EventEditForm({
  event,
  today,
}: {
  event: ManagedEvent;
  today: string;
}) {
  const [state, formAction, isPending] = useActionState(updateEvent, initialState);
  const [fields, setFields] = useState(() => getFields(event));
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "success") return;

    setFields(getFields(state.event));
    router.refresh();
  }, [router, state]);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={fields.id} readOnly />

      <label className="grid gap-1 text-sm text-stone-300">
        Název
        <input
          name="title"
          type="text"
          value={fields.title}
          pattern={nonWhitespacePattern}
          title="Zadejte alespoň jeden znak kromě mezer."
          onChange={(event) =>
            setFields((current) => ({ ...current, title: event.target.value }))
          }
          required
          className="rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-white outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/30"
        />
      </label>

      <label className="grid gap-1 text-sm text-stone-300">
        Datum
        <input
          name="date"
          type="date"
          min={today}
          value={fields.date}
          onChange={(event) =>
            setFields((current) => ({ ...current, date: event.target.value }))
          }
          required
          className="rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-white outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/30"
        />
      </label>

      <label className="grid gap-1 text-sm text-stone-300">
        Místo
        <input
          name="location"
          type="text"
          value={fields.location}
          pattern={nonWhitespacePattern}
          title="Zadejte alespoň jeden znak kromě mezer."
          onChange={(event) =>
            setFields((current) => ({ ...current, location: event.target.value }))
          }
          required
          className="rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-white outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/30"
        />
      </label>

      <label className="grid gap-1 text-sm text-stone-300 sm:col-span-2">
        Popis (volitelný)
        <textarea
          name="description"
          value={fields.description}
          onChange={(event) =>
            setFields((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          rows={3}
          className="resize-y rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-white outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/30"
        />
      </label>

      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-red-700 px-4 py-2 font-medium text-white transition hover:bg-red-600 disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          {isPending ? "Ukládám…" : "Uložit změny"}
        </button>
        {state.status !== "idle" && (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={
              state.status === "error" ? "text-sm text-red-300" : "text-sm text-green-300"
            }
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

export default function EventEditor({ events, today, onClose }: EventEditorProps) {
  const sortedEvents = useMemo(
    () => [...events].sort((first, second) => first.date.localeCompare(second.date)),
    [events],
  );
  const [selectedId, setSelectedId] = useState(sortedEvents[0]?.id ?? "");
  const selectedEvent = sortedEvents.find((event) => event.id === selectedId);

  useEffect(() => {
    if (!sortedEvents.some((event) => event.id === selectedId)) {
      setSelectedId(sortedEvents[0]?.id ?? "");
    }
  }, [selectedId, sortedEvents]);

  return (
    <section
      aria-label="Správa akcí"
      className="mx-auto mb-8 max-w-3xl rounded-lg border border-stone-700 bg-stone-900/80 p-4 text-left text-white shadow-xl sm:p-6"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">Upravit akci</h3>
          <p className="mt-1 text-sm text-stone-400">
            Plakát zůstane beze změny.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md border border-stone-700 px-3 py-2 text-sm hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Zavřít
        </button>
      </div>

      {sortedEvents.length > 0 ? (
        <>
          <label className="mb-5 grid max-w-xl gap-1 text-sm text-stone-300">
            Vyberte akci
            <select
              value={selectedEvent?.id ?? ""}
              onChange={(event) => setSelectedId(event.target.value)}
              className="w-full rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-white outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/30"
            >
              {sortedEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.date} · {event.title} · {event.location}
                </option>
              ))}
            </select>
          </label>
          {selectedEvent && (
            <EventEditForm key={selectedId} event={selectedEvent} today={today} />
          )}
        </>
      ) : (
        <p className="text-sm text-stone-300">Zatím nejsou žádné akce k úpravě.</p>
      )}
    </section>
  );
}
