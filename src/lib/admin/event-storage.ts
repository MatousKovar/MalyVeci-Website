import "server-only";
import { randomUUID } from "node:crypto";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  EventCreateFields,
  EventUpdateFields,
} from "@/lib/admin/event-update.mjs";
import type { EventContent } from "@/lib/content-types";
import { validateEvents } from "@/lib/content-validation.mjs";
import { readEventContent } from "@/lib/event-content.mjs";

const eventFilePath = resolve(process.cwd(), "src/content/events.json");
const githubApiVersion = "2026-03-10";
const githubWriteAttempts = 3;

type GithubContent = {
  sha: string;
  content: string;
  encoding: string;
};

type EventMutation<Result> = (events: EventContent[]) => Result;

function usesGithubStorage() {
  return process.env.VERCEL === "1";
}

function getGithubConfiguration() {
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_CONTENTS_TOKEN;

  if (!repository || !/^[^/]+\/[^/]+$/.test(repository) || !token) {
    throw new Error("GitHub content storage is not configured.");
  }

  const [owner, name] = repository.split("/");
  return {
    owner,
    name,
    token,
    branch: process.env.GITHUB_CONTENTS_BRANCH || "main",
  };
}

export function hasEventStorageConfiguration() {
  if (!usesGithubStorage()) return true;

  try {
    getGithubConfiguration();
    return true;
  } catch {
    return false;
  }
}

function getGithubContentUrl() {
  const { owner, name, branch } = getGithubConfiguration();
  const query = new URLSearchParams({ ref: branch });
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/contents/src/content/events.json?${query}`;
}

async function requestGithubContent() {
  const { token } = getGithubConfiguration();
  const response = await fetch(getGithubContentUrl(), {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": githubApiVersion,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = new Error(`GitHub content request failed with status ${response.status}.`);
    Object.assign(error, { status: response.status });
    throw error;
  }

  return response.json() as Promise<GithubContent>;
}

function parseEventsContent(source: string): EventContent[] {
  const parsed: unknown = JSON.parse(source);
  const result = validateEvents(parsed);

  if (result.errors.length > 0 || !Array.isArray(parsed) || result.items.length !== parsed.length) {
    throw new Error("The events JSON contains invalid data and was not changed.");
  }

  return result.items;
}

async function readLocalEvents() {
  const source = await readFile(eventFilePath, "utf8");
  return parseEventsContent(source);
}

async function readGithubEvents() {
  const content = await requestGithubContent();
  if (content.encoding !== "base64" || typeof content.content !== "string") {
    throw new Error("GitHub did not return the events file as base64 content.");
  }

  return {
    events: parseEventsContent(Buffer.from(content.content, "base64").toString("utf8")),
    sha: content.sha,
  };
}

function serializeEvents(events: EventContent[]) {
  return `${JSON.stringify(events, null, 2)}\n`;
}

async function writeLocalEvents(events: EventContent[]) {
  const temporaryPath = `${eventFilePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, serializeEvents(events), { flag: "wx" });

  try {
    await rename(temporaryPath, eventFilePath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

async function writeGithubEvents(events: EventContent[], sha: string, message: string) {
  const { branch, token } = getGithubConfiguration();
  const content = Buffer.from(serializeEvents(events), "utf8").toString("base64");
  const response = await fetch(getGithubContentUrl(), {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": githubApiVersion,
    },
    body: JSON.stringify({ message, content, sha, branch }),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = new Error(`GitHub content write failed with status ${response.status}.`);
    Object.assign(error, { status: response.status });
    throw error;
  }

  return response.json();
}

async function mutateEvents<Result>(
  mutation: EventMutation<Result>,
  commitMessage: string,
) {
  if (!usesGithubStorage()) {
    const events = await readLocalEvents();
    const updatedEvents = [...events];
    const result = mutation(updatedEvents);
    validateMutationResult(updatedEvents);
    await writeLocalEvents(updatedEvents);
    return result;
  }

  for (let attempt = 0; attempt < githubWriteAttempts; attempt += 1) {
    const { events, sha } = await readGithubEvents();
    const updatedEvents = [...events];
    const result = mutation(updatedEvents);
    validateMutationResult(updatedEvents);

    try {
      await writeGithubEvents(updatedEvents, sha, commitMessage);
      return result;
    } catch (error) {
      if (
        (error as { status?: number }).status !== 409 ||
        attempt === githubWriteAttempts - 1
      ) {
        throw error;
      }
    }
  }

  throw new Error("Could not save the events file after concurrent edits.");
}

function validateMutationResult(events: EventContent[]) {
  const validation = validateEvents(events);
  if (validation.errors.length > 0 || validation.items.length !== events.length) {
    throw new Error("The event change would create invalid content.");
  }
}

export async function readManagedEventContent() {
  const events = usesGithubStorage()
    ? (await readGithubEvents()).events
    : await readLocalEvents();

  return readEventContent(events);
}

export async function findManagedEventById(id: string) {
  const events = usesGithubStorage()
    ? (await readGithubEvents()).events
    : await readLocalEvents();
  const event = events.find((item) => item.id === id);
  return event ? { id: event.id, date: event.date } : undefined;
}

export async function findOtherManagedEventOnDate(date: string, excludedId: string) {
  const events = usesGithubStorage()
    ? (await readGithubEvents()).events
    : await readLocalEvents();
  const event = events.find((item) => item.date === date && item.id !== excludedId);
  return event ? { id: event.id } : undefined;
}

export async function updateManagedEventInStorage(id: string, fields: EventUpdateFields) {
  await mutateEvents((events) => {
    const index = events.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("The event no longer exists.");

    const conflict = events.find((item) => item.date === fields.date && item.id !== id);
    if (conflict) throw new Error("Another event already uses this date.");

    const eventWithoutDescription = { ...events[index] };
    delete eventWithoutDescription.description;
    events[index] = {
      ...eventWithoutDescription,
      title: fields.title,
      date: fields.date,
      location: fields.location,
      ...(fields.description === null ? {} : { description: fields.description }),
    };
  }, `Upravit akci ${id}`);
}

export async function createManagedEventInStorage(fields: EventCreateFields) {
  const id = `event-${randomUUID()}`;
  await mutateEvents((events) => {
    if (events.some((event) => event.date === fields.date)) {
      throw new Error("Another event already uses this date.");
    }

    events.push({
      id,
      title: fields.title,
      date: fields.date,
      location: fields.location,
      ...(fields.description ? { description: fields.description } : {}),
    });
  }, `Přidat akci ${id}`);

  return id;
}

export async function deleteManagedEventFromStorage(id: string) {
  await mutateEvents((events) => {
    const index = events.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("The event no longer exists.");
    events.splice(index, 1);
  }, `Odebrat akci ${id}`);
}
