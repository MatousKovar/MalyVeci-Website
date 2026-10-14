import "server-only";
import { randomUUID } from "node:crypto";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ShortContent } from "@/lib/content-types";
import { validateShorts } from "@/lib/content-validation.mjs";
import { getGithubConfiguration, githubApiVersion, usesGithubStorage } from "./event-file.mjs";

const shortsPath = "src/content/shorts.json";
let localWriteQueue = Promise.resolve();

export class ShortVideoInputError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "ShortVideoInputError";
  }
}

function canonicalVideoId(input: unknown): string {
  const invalid = () => new ShortVideoInputError("Zadejte platný YouTube odkaz nebo 11znakové ID videa.");
  if (typeof input !== "string") throw invalid();
  const value = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw invalid();
  }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.port) throw invalid();
  let id: string | null = null;
  if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else id = url.pathname.match(/^\/(?:shorts|embed|v)\/([A-Za-z0-9_-]{11})\/?$/)?.[1] ?? null;
  } else if (url.hostname === "youtu.be" || url.hostname === "www.youtu.be") {
    id = url.pathname.match(/^\/([A-Za-z0-9_-]{11})\/?$/)?.[1] ?? null;
  }
  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) throw invalid();
  return id;
}

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

async function updateLocalVideos(update: (videos: ShortContent[]) => ShortContent[]) {
  const target = resolve(process.cwd(), shortsPath);
  const videos = parseShorts(await readFile(target, "utf8"));
  const updated = update(videos);
  const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, serializeShorts(updated), { flag: "wx" });
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

async function updateGithubVideos(update: (videos: ShortContent[]) => ShortContent[], message: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const file = await githubRequest("GET");
    if (file.encoding !== "base64" || typeof file.content !== "string" || typeof file.sha !== "string") {
      throw new Error("GitHub did not return the shorts file as base64 content.");
    }
    const videos = parseShorts(Buffer.from(file.content, "base64").toString("utf8"));
    const updated = update(videos);
    try {
      await githubRequest("PUT", {
        message,
        content: Buffer.from(serializeShorts(updated), "utf8").toString("base64"),
        sha: file.sha,
        branch: getGithubConfiguration().branch,
      });
      return;
    } catch (error) {
      if ((error as { status?: number }).status !== 409 || attempt === 2) throw error;
    }
  }
}

async function updateManagedVideos(update: (videos: ShortContent[]) => ShortContent[], message: string) {
  if (usesGithubStorage()) {
    await updateGithubVideos(update, message);
  } else {
    const result = localWriteQueue.then(() => updateLocalVideos(update));
    localWriteQueue = result.then(() => undefined, () => undefined);
    await result;
  }
}

export async function addManagedShortVideo(input: unknown) {
  const videoId = canonicalVideoId(input);
  let video: ShortContent = { id: randomUUID(), videoId, order: 0 };
  await updateManagedVideos((videos) => {
    if (videos.some((item) => item.videoId === videoId)) {
      throw new ShortVideoInputError("Toto YouTube video už je v seznamu.", 409);
    }
    const order = videos.reduce((maximum, item) => Math.max(maximum, item.order), -1) + 1;
    if (!Number.isSafeInteger(order)) throw new Error("Pořadí krátkých videí překročilo povolený rozsah.");
    video = { ...video, order };
    return [...videos, video];
  }, `Přidat krátké video ${videoId}`);
  return {
    video,
    pendingDeployment: usesGithubStorage(),
    message: usesGithubStorage()
      ? "Krátké video je uložené. Na veřejném webu se zobrazí po dokončení nasazení."
      : "Krátké video je přidané na web.",
  };
}

export async function deleteManagedShortVideo(id: string) {
  await updateManagedVideos((videos) => removeVideo(videos, id), `Smazat krátké video ${id}`);
  return {
    id,
    message: usesGithubStorage()
      ? "Krátké video je odebrané. Z veřejného webu zmizí po dokončení nasazení."
      : "Krátké video je smazané z webu.",
  };
}
