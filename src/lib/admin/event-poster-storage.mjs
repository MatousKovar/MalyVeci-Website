import { randomUUID } from "node:crypto";
import { readFile, readdir, readlink, lstat, mkdir, realpath, unlink, writeFile } from "node:fs/promises";
import { basename, extname, resolve, sep } from "node:path";
import sharp from "sharp";
import { eventsPath, getGithubConfiguration, githubApiVersion, parseEventsContent, readLocalEvents, serializeEvents, usesGithubStorage, writeLocalEvents } from "./event-file.mjs";
import { runLocalEventMutation } from "./event-write-queue.mjs";

export const MAX_POSTER_UPLOAD_BYTES = 3_500_000;
const formats = { jpeg: { type: "image/jpeg", extension: "jpg" }, png: { type: "image/png", extension: "png" }, webp: { type: "image/webp", extension: "webp" } };
const textExtensions = new Set([".json", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".html", ".svg", ".md"]);

export class PosterValidationError extends Error {}

async function preparePoster(bytes, contentType) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > MAX_POSTER_UPLOAD_BYTES) {
    throw new PosterValidationError("Plakát musí mít nejvýše 3,5 MB.");
  }
  try {
    const image = sharp(bytes, { limitInputPixels: 40_000_000, failOn: "warning", animated: true });
    const metadata = await image.metadata();
    const format = formats[metadata.format];
    if (!format || format.type !== contentType || !metadata.width || !metadata.height || (metadata.pages ?? 1) !== 1) {
      throw new Error("Unsupported image");
    }
    await image.stats();
    return { bytes, path: `/posters/${randomUUID()}.${format.extension}` };
  } catch {
    throw new PosterValidationError("Vyberte platný neanimovaný obrázek JPEG, PNG nebo WebP.");
  }
}

function changePoster(events, id, poster) {
  const event = events.find((item) => item.id === id);
  if (!event) throw new PosterValidationError("Vybraná akce už neexistuje. Obnovte stránku.");
  const oldPath = event.posterPath;
  if (poster) event.posterPath = poster.path;
  else delete event.posterPath;
  return oldPath;
}

function references(source, imagePath) {
  try { source = JSON.stringify(JSON.parse(source)); } catch { /* Plain text */ }
  const filename = basename(imagePath);
  return source.includes(filename) || source.includes(encodeURIComponent(filename));
}

function publicFile(root, imagePath) {
  if (typeof imagePath !== "string" || !imagePath.startsWith("/") || imagePath.startsWith("//") || /[\\%?#]/.test(imagePath) || imagePath.split("/").some((part) => part === ".." || part === ".")) return undefined;
  const directory = resolve(root, "public");
  const file = resolve(directory, `.${imagePath}`);
  return file.startsWith(`${directory}${sep}`) ? file : undefined;
}

async function localHasReference(root, imagePath) {
  async function search(directory) {
    for (const entry of await readdir(resolve(root, directory), { withFileTypes: true })) {
      if ([".git", ".next", "node_modules"].includes(entry.name)) continue;
      const path = directory ? `${directory}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) {
        if (references(await readlink(resolve(root, path)), imagePath)) return true;
      } else if (entry.isDirectory()) {
        if (await search(path)) return true;
      } else if (entry.isFile() && path !== eventsPath && textExtensions.has(extname(path))) {
        if (references(await readFile(resolve(root, path), "utf8"), imagePath)) return true;
      }
    }
    return false;
  }
  return search("");
}

async function changeLocally(root, id, poster) {
  return runLocalEventMutation(async () => {
    const original = await readLocalEvents(root);
    const events = original.map((event) => ({ ...event }));
    const oldPath = changePoster(events, id, poster);
    const oldFile = oldPath && publicFile(root, oldPath);
    const keepOld = !oldFile || references(JSON.stringify(events), oldPath) || await localHasReference(root, oldPath);
    const newFile = poster && publicFile(root, poster.path);
    if (newFile) {
      await mkdir(resolve(root, "public/posters"), { recursive: true });
      await writeFile(newFile, poster.bytes, { flag: "wx" });
    }
    try {
      await writeLocalEvents(events, root);
    } catch (error) {
      if (newFile) await unlink(newFile).catch(() => undefined);
      throw error;
    }
    if (!keepOld) {
      try {
        // A symlink may belong to another asset; leave it in place.
        if ((await lstat(oldFile)).isFile() && await realpath(oldFile) === oldFile) await unlink(oldFile);
      } catch (error) {
        if (error.code !== "ENOENT") {
          await writeLocalEvents(original, root);
          if (newFile) await unlink(newFile).catch(() => undefined);
          throw error;
        }
      }
    }
    return events.find((event) => event.id === id);
  });
}

async function changeOnGithub(id, poster) {
  const { owner, name, token, branch } = getGithubConfiguration();
  const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  async function request(path, body, method = "POST") {
    const response = await fetch(`${base}${path}`, {
      method: body ? method : "GET",
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": githubApiVersion, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
    });
    if (!response.ok) {
      const error = new Error(`GitHub request failed: ${response.status}`);
      error.status = response.status;
      error.details = await response.text();
      throw error;
    }
    return response.json();
  }
  async function readBlob(sha) {
    const blob = await request(`/git/blobs/${sha}`);
    if (blob.encoding !== "base64" || typeof blob.content !== "string") throw new Error("Invalid GitHub blob");
    return Buffer.from(blob.content, "base64").toString("utf8");
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const ref = await request(`/git/ref/heads/${encodeURIComponent(branch)}`);
    const head = ref.object.sha;
    const baseCommit = await request(`/git/commits/${head}`);
    const tree = await request(`/git/trees/${baseCommit.tree.sha}?recursive=1`);
    if (tree.truncated) throw new Error("GitHub returned an incomplete tree.");
    const eventEntry = tree.tree.find((entry) => entry.path === eventsPath && entry.type === "blob");
    if (!eventEntry) throw new Error("Events file is missing.");
    const events = parseEventsContent(await readBlob(eventEntry.sha));
    const oldPath = changePoster(events, id, poster);
    let keepOld = !oldPath || !publicFile(process.cwd(), oldPath) || references(JSON.stringify(events), oldPath);
    for (const entry of tree.tree) {
      if (keepOld) break;
      if (entry.type === "blob" && entry.path !== eventsPath && (textExtensions.has(extname(entry.path)) || entry.mode === "120000")) {
        keepOld = references(await readBlob(entry.sha), oldPath);
      }
    }
    const changes = [];
    if (poster) {
      const blob = await request("/git/blobs", { content: poster.bytes.toString("base64"), encoding: "base64" });
      changes.push({ path: `public${poster.path}`, mode: "100644", type: "blob", sha: blob.sha });
    }
    const oldEntry = tree.tree.find((entry) => entry.path === `public${oldPath}`);
    if (!keepOld && oldEntry?.type === "blob" && oldEntry.mode !== "120000") {
      changes.push({ path: oldEntry.path, mode: oldEntry.mode, type: "blob", sha: null });
    }
    const eventsBlob = await request("/git/blobs", { content: serializeEvents(events), encoding: "utf-8" });
    changes.push({ path: eventsPath, mode: "100644", type: "blob", sha: eventsBlob.sha });
    const newTree = await request("/git/trees", { base_tree: baseCommit.tree.sha, tree: changes });
    const commit = await request("/git/commits", { message: `Změnit plakát akce ${id}`, tree: newTree.sha, parents: [head] });
    try {
      await request(`/git/refs/heads/${encodeURIComponent(branch)}`, { sha: commit.sha, force: false }, "PATCH");
      return events.find((event) => event.id === id);
    } catch (error) {
      if (attempt === 2 || !(error.status === 409 || (error.status === 422 && /fast.?forward|reference.*update/i.test(error.details)))) throw error;
    }
  }
}

export async function changeEventPoster(id, bytes, contentType, { root = process.cwd() } = {}) {
  const poster = bytes === null ? null : await preparePoster(bytes, contentType);
  if (usesGithubStorage()) {
    if (process.env.VERCEL_ENV !== "production") throw new PosterValidationError("Plakáty lze měnit jen na produkčním webu.");
    return changeOnGithub(id, poster);
  }
  return changeLocally(root, id, poster);
}
