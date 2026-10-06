"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import type { ManagedEvent } from "@/lib/events";
import type { EventEditorActionState } from "@/lib/admin/event-update.mjs";
import { createEvent, deleteEvent, updateEvent } from "./actions";

type EventEditorProps = {
  events: ManagedEvent[];
  today: string;
  onClose?: () => void;
};

type EventFields = {
  title: string;
  date: string;
  location: string;
  description: string;
};

type EventAction = (
  previousState: EventEditorActionState,
  formData: FormData,
) => Promise<EventEditorActionState>;

const initialState: EventEditorActionState = { status: "idle" };
const nonWhitespacePattern = String.raw`.*\S.*`;

function getFields(event?: ManagedEvent): EventFields {
  return {
    title: event?.title ?? "",
    date: event?.date ?? "",
    location: event?.location ?? "",
    description: event?.description ?? "",
  };
}

function EventForm({
  event,
  today,
  action,
  submitLabel,
  onCancel,
  onSaved,
}: {
  event?: ManagedEvent;
  today: string;
  action: EventAction;
  submitLabel: string;
  onCancel?: () => void;
  onSaved: (event?: ManagedEvent) => void;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [fields, setFields] = useState(() => getFields(event));

  useEffect(() => {
    if (state.status !== "success") return;
    if (state.event) setFields(getFields(state.event));
    onSaved(state.event);
  }, [onSaved, state]);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {event && <input type="hidden" name="id" value={event.id} readOnly />}

      <label className="grid gap-1 text-sm text-stone-300">
        Název
        <input
          name="title"
          type="text"
          value={fields.title}
          pattern={nonWhitespacePattern}
          title="Zadejte alespoň jeden znak kromě mezer."
          onChange={(inputEvent) =>
            setFields((current) => ({ ...current, title: inputEvent.target.value }))
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
          onChange={(inputEvent) =>
            setFields((current) => ({ ...current, date: inputEvent.target.value }))
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
          onChange={(inputEvent) =>
            setFields((current) => ({ ...current, location: inputEvent.target.value }))
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
          onChange={(inputEvent) =>
            setFields((current) => ({
              ...current,
              description: inputEvent.target.value,
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
          {isPending ? "Ukládám…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-stone-700 px-4 py-2 text-sm hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Zrušit
          </button>
        )}
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

function DeleteEventForm({ event }: { event: ManagedEvent }) {
  const [state, formAction, isPending] = useActionState(deleteEvent, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state]);

  function confirmRemoval(formEvent: FormEvent<HTMLFormElement>) {
    if (!window.confirm(`Opravdu odebrat akci „${event.title}“?`)) {
      formEvent.preventDefault();
    }
  }

  return (
    <form action={formAction} onSubmit={confirmRemoval} className="mt-5 border-t border-stone-700 pt-4">
      <input type="hidden" name="id" value={event.id} readOnly />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md border border-red-700 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-950 disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          {isPending ? "Odebírám…" : "Odebrat vybranou akci"}
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
  const [isCreating, setIsCreating] = useState(false);
  const selectedEvent = sortedEvents.find((event) => event.id === selectedId);
  const router = useRouter();

  useEffect(() => {
    if (!sortedEvents.some((event) => event.id === selectedId)) {
      setSelectedId(sortedEvents[0]?.id ?? "");
    }
  }, [selectedId, sortedEvents]);

  const handleSaved = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <section
      aria-label="Správa akcí"
      className="mx-auto mb-8 max-w-3xl rounded-lg border border-stone-700 bg-stone-900/80 p-4 text-left text-white shadow-xl sm:p-6"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">Správa akcí</h3>
          <p className="mt-1 text-sm text-stone-400">
            Plakát existující akce zůstává beze změny.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-stone-700 px-3 py-2 text-sm hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Zavřít
          </button>
        )}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-pressed={isCreating}
          onClick={() => setIsCreating(true)}
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          Přidat akci
        </button>
        {!isCreating && sortedEvents.length > 0 && (
          <span className="text-sm text-stone-400">
            {sortedEvents.length} {sortedEvents.length === 1 ? "akce" : "akcí"}
          </span>
        )}
      </div>

      {isCreating ? (
        <EventForm
          key="new-event"
          today={today}
          action={createEvent}
          submitLabel="Přidat akci"
          onCancel={() => setIsCreating(false)}
          onSaved={handleSaved}
        />
      ) : sortedEvents.length > 0 && selectedEvent ? (
        <>
          <label className="mb-5 grid max-w-xl gap-1 text-sm text-stone-300">
            Vyberte akci k úpravě
            <select
              value={selectedEvent.id}
              onChange={(inputEvent) => setSelectedId(inputEvent.target.value)}
              className="w-full rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-white outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/30"
            >
              {sortedEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.date} · {event.title} · {event.location}
                </option>
              ))}
            </select>
          </label>
          <EventForm
            key={selectedEvent.id}
            event={selectedEvent}
            today={today}
            action={updateEvent}
            submitLabel="Uložit změny"
            onSaved={handleSaved}
          />
          <DeleteEventForm key={`delete-${selectedEvent.id}`} event={selectedEvent} />
        </>
      ) : (
        <p className="text-sm text-stone-300">Zatím nejsou žádné akce. Přidejte první.</p>
      )}
    </section>
  );
}
