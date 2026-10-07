import { existsSync } from "node:fs";
import eventContent from "../content/events.json" with { type: "json" };
import { validateEvents } from "./content-validation.mjs";

/**
 * @param {unknown} [source]
 * @returns {{ events: import("./content-types").EventContent[], errors: string[] }}
 */
export function readEventContent(source = eventContent) {
  const { items, errors } = validateEvents(source);
  const events = items.map((event) => {
    if (
      !event.posterPath ||
      existsSync(new URL(`../../public${event.posterPath}`, import.meta.url))
    ) {
      return event;
    }

    errors.push(
      `Akce "${event.id}": soubor plakátu "${event.posterPath}" neexistuje.`,
    );
    const eventWithoutPoster = { ...event };
    delete eventWithoutPoster.posterPath;
    return eventWithoutPoster;
  });

  return {
    events: events.sort((left, right) => left.date.localeCompare(right.date)),
    errors,
  };
}
