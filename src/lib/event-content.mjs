import { existsSync } from "node:fs";
import { resolve } from "node:path";
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
      existsSync(resolve(process.cwd(), "public", event.posterPath.slice(1)))
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
