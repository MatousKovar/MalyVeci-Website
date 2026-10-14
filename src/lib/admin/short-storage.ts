import "server-only";
import { randomUUID } from "node:crypto";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ShortContent } from "@/lib/content-types";
import { validateShorts } from "@/lib/content-validation.mjs";
import { getGithubConfiguration, githubApiVersion, usesGithubStorage } from "./event-file.mjs";

const shortsPath = "src/content/shorts.json";
let localWriteQueue = Promise.resolve();

export class ShortVideoNotFoundError extends Error {
  constructor() {
    super("Krátké video už není v seznamu.");
    this.name = "ShortVideoNotFoundError";
  }
}

function parseShorts(source: string): ShortContent[] {
  const parsed: unknown = JSON.parse(source);
  const result = validateShorts(parsed);
  if (!Array.isArray(parsed) || result.errors.length || result.items.length !== parsed.length) {
    throw new Error("Soubor krátkých videí obsahuje neplatná data.");
  }
  return parsed as ShortContent[];
}

function removeVideo(videos: ShortContent[], id: string) {
  const index = videos.findIndex((video) => video.id === id);
  if (index === -1) throw new ShortVideoNotFoundError();
  return [...videos.slice(0, index), ...videos.slice(index + 1)];
}

function serializeShorts(videos: ShortContent[]) {
  return `${JSON.stringify(videos, null, 2)}\n`;
}

async function deleteLocalVideo(id: string) {
  const target = resolve(process.cwd(), shortsPath);
  const videos = parseShorts(await readFile(target, "utf8"));
  const remaining = removeVideo(videos, id);
  const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, serializeShorts(remaining), { flag: "wx" });
    await rename(temporary, target);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
}

async function githubRequest(method: "GET" | "PUT", body?: object) {
  const { owner, name, branch, token } = getGithubConfiguration();
  const query = new URLSearchParams({ ref: branch });
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/contents/${shortsPath}?${query}`,
    {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": githubApiVersion,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw Object.assign(new Error(`GitHub content request failed with status ${response.status}.`), {
      status: response.status,
    });
  }
  return response.json();
}

async function deleteGithubVideo(id: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const file = await githubRequest("GET");
    if (file.encoding !== "base64" || typeof file.content !== "string" || typeof file.sha !== "string") {
      throw new Error("GitHub did not return the shorts file as base64 content.");
    }
    const videos = parseShorts(Buffer.from(file.content, "base64").toString("utf8"));
    const remaining = removeVideo(videos, id);
    try {
      await githubRequest("PUT", {
        message: `Smazat krátké video ${id}`,
        content: Buffer.from(serializeShorts(remaining), "utf8").toString("base64"),
        sha: file.sha,
        branch: getGithubConfiguration().branch,
      });
      return;
    } catch (error) {
      if ((error as { status?: number }).status !== 409 || attempt === 2) throw error;
    }
  }
}

export async function deleteManagedShortVideo(id: string) {
  if (usesGithubStorage()) {
    await deleteGithubVideo(id);
  } else {
    const result = localWriteQueue.then(() => deleteLocalVideo(id));
    localWriteQueue = result.then(() => undefined, () => undefined);
    await result;
  }
  return {
    id,
    message: usesGithubStorage()
      ? "Krátké video je odebrané. Z veřejného webu zmizí po dokončení nasazení."
      : "Krátké video je smazané z webu.",
  };
}
