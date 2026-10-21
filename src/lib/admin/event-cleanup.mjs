import { lstat, readFile, realpath, unlink } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { validateEvents } from "../content-validation.mjs";
import { getTodayInPrague } from "./event-update.mjs";
import { eventsPath, getGithubConfiguration, githubApiVersion, serializeEvents, usesGithubStorage, writeLocalEvents } from "./event-file.mjs";
import { runLocalEventMutation } from "./event-write-queue.mjs";
import { localHasReference, publicFile, references, textExtensions } from "./poster-references.mjs";

function planCleanup(source, today) {
  const original = JSON.parse(source);
  if (!Array.isArray(original)) throw new Error("Events must be an array.");
  const events = [];
  const posters = new Set();
  const ids = new Set();
  const dates = new Set();
  let removedEvents = 0;
  let errors = 0;
  for (const entry of original) {
    const validation = validateEvents([entry]);
    const event = validation.items[0];
    if (!event || ids.has(event.id) || dates.has(event.date)) {
      errors += 1;
      events.push(entry);
      continue;
    }
    ids.add(event.id);
    dates.add(event.date);
    if (event.date >= today) {
      events.push(entry);
    } else {
      removedEvents += 1;
      if (event.posterPath) posters.add(event.posterPath);
    }
  }
  return { events, posters, removedEvents, errors };
}

function summary(plan, today, removedPosters) {
  return { today, removedEvents: plan.removedEvents, removedPosters, errors: plan.errors };
}

async function cleanupLocally(root, today) {
  return runLocalEventMutation(async () => {
    const plan = planCleanup(await readFile(resolve(root, eventsPath), "utf8"), today);
    if (!plan.removedEvents) return summary(plan, today, 0);
    const unused = [];
    for (const path of plan.posters) {
      const file = publicFile(root, path);
      if (!file || references(JSON.stringify(plan.events), path) || await localHasReference(root, path)) continue;
      try {
        if ((await lstat(file)).isFile() && await realpath(file) === file) unused.push(file);
      } catch (error) {
        if (error.code !== "ENOENT") plan.errors += 1;
      }
    }
    await writeLocalEvents(plan.events, root);
    let removedPosters = 0;
    for (const file of unused) {
      try {
        await unlink(file);
        removedPosters += 1;
      } catch (error) {
        if (error.code !== "ENOENT") plan.errors += 1;
      }
    }
    return summary(plan, today, removedPosters);
  });
}

async function cleanupOnGithub(today) {
  const { owner, name, token, branch } = getGithubConfiguration();
  const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  async function request(path, body, method = "POST") {
    const response = await fetch(`${base}${path}`, {
      method: body ? method : "GET",
      headers: {
        Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": githubApiVersion,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
    });
    if (!response.ok) {
      const error = new Error("GitHub cleanup request failed.");
      error.status = response.status;
      throw error;
    }
    return response.json();
  }
  async function readBlob(sha) {
    const blob = await request(`/git/blobs/${sha}`);
    if (blob.encoding !== "base64" || typeof blob.content !== "string") throw new Error("Invalid GitHub blob.");
    return Buffer.from(blob.content, "base64").toString("utf8");
  }
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const ref = await request(`/git/ref/heads/${encodeURIComponent(branch)}`);
    const head = ref.object.sha;
    const commit = await request(`/git/commits/${head}`);
    const snapshot = await request(`/git/trees/${commit.tree.sha}?recursive=1`);
    if (snapshot.truncated !== false || !Array.isArray(snapshot.tree)) throw new Error("Incomplete GitHub tree.");
    const eventEntry = snapshot.tree.find((entry) => entry.path === eventsPath && entry.type === "blob" && entry.mode === "100644");
    if (!eventEntry) throw new Error("Events file is missing or not a regular file.");
    const plan = planCleanup(await readBlob(eventEntry.sha), today);
    if (!plan.removedEvents) return summary(plan, today, 0);
    const candidates = new Set([...plan.posters].filter((path) =>
      publicFile(process.cwd(), path) && !references(JSON.stringify(plan.events), path),
    ));
    for (const entry of snapshot.tree) {
      if (!candidates.size) break;
      if (entry.path === eventsPath || entry.type !== "blob" || !(textExtensions.has(extname(entry.path)) || entry.mode === "120000")) continue;
      const source = await readBlob(entry.sha);
      for (const path of candidates) {
        if (references(source, path)) candidates.delete(path);
      }
    }
    const changes = [];
    for (const path of candidates) {
      const entry = snapshot.tree.find((entry) => entry.path === `public${path}`);
      if (entry?.type === "blob" && ["100644", "100755"].includes(entry.mode)) {
        changes.push({ path: entry.path, mode: entry.mode, type: "blob", sha: null });
      }
    }
    const removedPosters = changes.length;
    const blob = await request("/git/blobs", { content: serializeEvents(plan.events), encoding: "utf-8" });
    changes.push({ path: eventsPath, mode: "100644", type: "blob", sha: blob.sha });
    const tree = await request("/git/trees", { base_tree: commit.tree.sha, tree: changes });
    const updated = await request("/git/commits", {
      message: `Odstranit proběhlé akce před ${today}`, tree: tree.sha, parents: [head],
    });
    try {
      await request(`/git/refs/heads/${encodeURIComponent(branch)}`, { sha: updated.sha, force: false }, "PATCH");
      return summary(plan, today, removedPosters);
    } catch (error) {
      if (attempt === 2 || ![409, 422].includes(error.status)) throw error;
    }
  }
}

export async function cleanupPastEvents({ root = process.cwd(), now = new Date() } = {}) {
  const today = getTodayInPrague(now);
  if (usesGithubStorage()) {
    if (process.env.VERCEL_ENV !== "production") throw new Error("Cleanup is only available in production.");
    return cleanupOnGithub(today);
  }
  return cleanupLocally(root, today);
}
