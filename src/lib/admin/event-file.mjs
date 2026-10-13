import { randomUUID } from "node:crypto";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateEvents } from "../content-validation.mjs";

export const eventsPath = "src/content/events.json";
export const githubApiVersion = "2026-03-10";

export function usesGithubStorage() {
  return process.env.VERCEL === "1";
}

export function getGithubConfiguration() {
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_CONTENTS_TOKEN;
  if (!repository || !/^[^/]+\/[^/]+$/.test(repository) || !token) {
    throw new Error("GitHub content storage is not configured.");
  }
  const [owner, name] = repository.split("/");
  return { owner, name, token, branch: process.env.GITHUB_CONTENTS_BRANCH || "main" };
}

export function parseEventsContent(source) {
  const parsed = JSON.parse(source);
  const result = validateEvents(parsed);
  if (!Array.isArray(parsed) || result.errors.length || result.items.length !== parsed.length) {
    throw new Error("Soubor akcí obsahuje neplatná data.");
  }
  return result.items;
}

export function serializeEvents(events) {
  return `${JSON.stringify(events, null, 2)}\n`;
}

export async function readLocalEvents(root = process.cwd()) {
  return parseEventsContent(await readFile(resolve(root, eventsPath), "utf8"));
}

export async function writeLocalEvents(events, root = process.cwd()) {
  const target = resolve(root, eventsPath);
  const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, serializeEvents(events), { flag: "wx" });
    await rename(temporary, target);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
}
