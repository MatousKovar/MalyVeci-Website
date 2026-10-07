import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  validateEvents,
  validateGalleryPhotos,
  validateShorts,
} from "../src/lib/content-validation.mjs";
import { readEventContent } from "../src/lib/event-content.mjs";

test("valid events are returned and an invalid date is reported without dropping the rest", () => {
  const result = validateEvents([
    {
      id: "event-2026-10-17",
      title: "Posvícenská zábava",
      date: "2026-10-17",
      location: "Doubravice",
    },
    {
      id: "event-invalid-date",
      title: "Neplatné datum",
      date: "2026-02-30",
      location: "Plzeň",
    },
    {
      id: "event-after-invalid",
      title: "Oslava narozenin",
      date: "2026-10-24",
      location: "Hoštice",
    },
  ]);

  assert.deepEqual(result.items, [
    {
      id: "event-2026-10-17",
      title: "Posvícenská zábava",
      date: "2026-10-17",
      location: "Doubravice",
    },
    {
      id: "event-after-invalid",
      title: "Oslava narozenin",
      date: "2026-10-24",
      location: "Hoštice",
    },
  ]);
  assert.deepEqual(result.errors, [
    'Akce "event-invalid-date": datum musí být platné datum ve formátu YYYY-MM-DD.',
  ]);
});

test("event content skips invalid records and sorts valid events by date", () => {
  const result = readEventContent([
    { id: "event-later", title: "Pozdější akce", date: "2026-12-12", location: "Plzeň" },
    { id: "event-invalid", title: "Neplatná akce", date: "2026-02-30", location: "Brno" },
    { id: "event-sooner", title: "Dřívější akce", date: "2026-10-17", location: "Praha" },
  ]);

  assert.deepEqual(result.events.map((event) => event.id), [
    "event-sooner",
    "event-later",
  ]);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /event-invalid/);
});

test("a missing event poster is reported while its event remains visible", () => {
  const result = readEventContent([
    {
      id: "event-missing-poster",
      title: "Akce bez souboru plakátu",
      date: "2026-10-17",
      location: "Praha",
      posterPath: "/missing-event-poster.jpg",
    },
  ]);

  assert.deepEqual(result.events, [
    {
      id: "event-missing-poster",
      title: "Akce bez souboru plakátu",
      date: "2026-10-17",
      location: "Praha",
    },
  ]);
  assert.deepEqual(result.errors, [
    'Akce "event-missing-poster": soubor plakátu "/missing-event-poster.jpg" neexistuje.',
  ]);
});

test("shorts require unique canonical YouTube IDs and explicit unique order", () => {
  const result = validateShorts([
    { id: "short-first", videoId: "iDQUGjGwNrs", order: 0 },
    { id: "short-second", videoId: "N5wYJKatssw", order: 1 },
    { id: "short-invalid", videoId: "https://youtu.be/kZdWxsTCQ5o", order: 2 },
    { id: "short-third", videoId: "kZdWxsTCQ5o", order: 2 },
    { id: "short-duplicate-order", videoId: "jN81OZ1XY74", order: 1 },
  ]);

  assert.deepEqual(result.items, [
    { id: "short-first", videoId: "iDQUGjGwNrs", order: 0 },
    { id: "short-second", videoId: "N5wYJKatssw", order: 1 },
    { id: "short-third", videoId: "kZdWxsTCQ5o", order: 2 },
  ]);
  assert.deepEqual(result.errors, [
    'Krátké video "short-invalid": videoId musí být kanonické 11znakové ID YouTube.',
    'Krátké video "short-duplicate-order": pořadí 1 už používá jiná položka.',
  ]);
});

test("gallery photos require local paths, dimensions, and unique order", () => {
  const result = validateGalleryPhotos([
    { id: "photo-stable-1", src: "/gallery/first.jpg", order: 0, width: 1920, height: 1080 },
    { id: "photo-stable-2", src: "/gallery/second.jpg", order: 1, width: 1080, height: 1920 },
    { id: "external.jpg", src: "https://example.com/external.jpg", order: 2, width: 1920, height: 1080 },
    { id: "zero-width.jpg", src: "/gallery/zero-width.jpg", order: 3, width: 0, height: 1080 },
    { id: "third.jpg", src: "/gallery/third.jpg", order: 2, width: 1920, height: 1080 },
    { id: "duplicate-order.jpg", src: "/gallery/duplicate-order.jpg", order: 1, width: 1920, height: 1080 },
  ]);

  assert.deepEqual(result.items, [
    { id: "photo-stable-1", src: "/gallery/first.jpg", order: 0, width: 1920, height: 1080 },
    { id: "photo-stable-2", src: "/gallery/second.jpg", order: 1, width: 1080, height: 1920 },
    { id: "third.jpg", src: "/gallery/third.jpg", order: 2, width: 1920, height: 1080 },
  ]);
  assert.deepEqual(result.errors, [
    'Fotka galerie "external.jpg": cesta musí ukazovat do složky /gallery/.',
    'Fotka galerie "zero-width.jpg": rozměry musí být kladná celá čísla.',
    'Fotka galerie "duplicate-order.jpg": pořadí 1 už používá jiná fotka.',
  ]);
});

test("the checked-in content files satisfy their validated formats", () => {
  const readContent = (name) =>
    JSON.parse(readFileSync(new URL(`../src/content/${name}.json`, import.meta.url), "utf8"));
  const events = validateEvents(readContent("events"));
  const shorts = validateShorts(readContent("shorts"));
  const gallery = validateGalleryPhotos(readContent("gallery"));

  assert.ok(events.items.length > 0);
  assert.deepEqual(events.errors, []);
  assert.ok(shorts.items.length > 0);
  assert.deepEqual(shorts.errors, []);
  assert.ok(gallery.items.length > 0);
  assert.deepEqual(gallery.errors, []);
  assert.deepEqual(
    gallery.items.filter((photo) => !existsSync(new URL(`../public${photo.src}`, import.meta.url))),
    [],
  );
  assert.ok(events.items.every((event) =>
    !event.posterPath || existsSync(new URL(`../public${event.posterPath}`, import.meta.url)),
  ));
});
