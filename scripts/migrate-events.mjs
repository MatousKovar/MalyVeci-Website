import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";
import eventSeed from "../src/lib/event-seed.json" with { type: "json" };

const apiVersion = "2026-10-05";
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
  throw new Error("Set the Sanity project, dataset, and write token in .env.local.");
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
});

const scriptDirectory = fileURLToPath(new URL(".", import.meta.url));
const todayInPrague = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Prague",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})
  .format(new Date())
  .replaceAll("/", "-");

function slug(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function eventId(event) {
  return `event-${event.date}-${slug(event.title)}-${slug(event.location)}`;
}

function eventIdentity(event) {
  return `${event.date}:${slug(event.title)}:${slug(event.location)}`;
}

function mimeType(path) {
  switch (extname(path).toLowerCase()) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    default:
      throw new Error(`Unsupported poster format: ${path}`);
  }
}

const upcomingEvents = eventSeed
  .filter((event) => event.date >= todayInPrague)
  .sort((left, right) => left.date.localeCompare(right.date));

const dates = [...new Set(upcomingEvents.map((event) => event.date))];
const existingEvents = await client.fetch(
  `*[_type == "event" && date in $dates]{_id,title,date,location,"posterAssetId":poster.asset._ref}`,
  { dates },
);
const existingByIdentity = new Map(
  existingEvents.map((event) => [eventIdentity(event), event]),
);

let createdCount = 0;
let updatedCount = 0;
let skippedCount = 0;

for (const event of upcomingEvents) {
  const _id = eventId(event);
  let asset;

  async function getPosterAsset() {
    if (!event.poster_location) return undefined;
    if (asset) return asset;

    const relativePath = event.poster_location.replace(/^\//, "");
    const posterPath = resolve(scriptDirectory, "..", "public", relativePath);
    await access(posterPath);

    const assetTitle = `event-poster-${_id}`;
    asset = await client.fetch(
      `*[_type == "sanity.imageAsset" && title == $assetTitle][0]{_id,url}`,
      { assetTitle },
    );

    if (!asset) {
      asset = await client.assets.upload(
        "image",
        createReadStream(posterPath),
        {
          filename: basename(posterPath),
          contentType: mimeType(posterPath),
          title: assetTitle,
        },
      );
    }

    return asset;
  }

  const existing = existingByIdentity.get(eventIdentity(event));
  if (existing) {
    if (event.poster_location && !existing.posterAssetId) {
      const posterAsset = await getPosterAsset();
      await client
        .patch(existing._id)
        .set({
          poster: {
            _type: "image",
            asset: { _type: "reference", _ref: posterAsset._id },
          },
        })
        .commit();
      updatedCount += 1;
    } else {
      skippedCount += 1;
    }
    continue;
  }

  const document = {
    _id,
    _type: "event",
    title: event.title,
    date: event.date,
    location: event.location,
    ...(event.description ? { description: event.description } : {}),
  };

  if (event.poster_location) {
    const posterAsset = await getPosterAsset();
    document.poster = {
      _type: "image",
      asset: { _type: "reference", _ref: posterAsset._id },
    };
  }

  await client.createIfNotExists(document);
  createdCount += 1;
  existingByIdentity.set(eventIdentity(event), { _id, posterAssetId: asset?._id });
}

console.log(
  `Sanity event migration complete. Created ${createdCount}, updated ${updatedCount}, skipped ${skippedCount}, cutoff ${todayInPrague}.`,
);
