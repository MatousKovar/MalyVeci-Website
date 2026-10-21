import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test, { after, beforeEach } from "node:test";
import ts from "typescript";
import { cleanupPastEvents } from "../src/lib/admin/event-cleanup.mjs";

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) specifier = new URL(`../src/${specifier.slice(2)}`, import.meta.url).href;
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith(".ts")) {
      return { format: "module", shortCircuit: true, source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText };
    }
    return nextLoad(url, context);
  },
});
const { GET } = await import("../src/app/api/cron/events/route.ts");
const directory = await realpath(await mkdtemp(join(tmpdir(), "event-cleanup-")));
const originalEnv = { ...process.env };
const originalDirectory = process.cwd();
const now = new Date("2026-10-25T02:30:00Z");
const past = { id: "past", title: "Včerejší akce", date: "2026-10-24", location: "Praha", posterPath: "/posters/past.jpg" };
const today = { id: "today", title: "Dnešní akce", date: "2026-10-25", location: "Praha" };
const future = { id: "future", title: "Budoucí akce", date: "2026-10-26", location: "Praha" };
const eventFile = join(directory, "src/content/events.json");
const imageFile = join(directory, "public/posters/past.jpg");

beforeEach(async () => {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("GITHUB_") || key.startsWith("VERCEL") || key === "CRON_SECRET") delete process.env[key];
  }
  process.chdir(directory);
  await rm(join(directory, "src"), { recursive: true, force: true });
  await rm(join(directory, "public"), { recursive: true, force: true });
  await mkdir(join(directory, "src/content"), { recursive: true });
  await mkdir(join(directory, "public/posters"), { recursive: true });
  await writeFile(eventFile, JSON.stringify([past, today, future]));
  await writeFile(imageFile, "poster bytes");
});

after(async () => {
  hooks.deregister();
  process.chdir(originalDirectory);
  process.env = originalEnv;
  await rm(directory, { recursive: true, force: true });
});

const readEvents = async () => JSON.parse(await readFile(eventFile, "utf8"));
const cleanup = () => cleanupPastEvents({ root: directory, now });

test("cleanup removes yesterday and its unused poster, keeps today and tomorrow, and can repeat", async () => {
  assert.deepEqual(await cleanup(), { today: "2026-10-25", removedEvents: 1, removedPosters: 1, errors: 0 });
  assert.deepEqual(await readEvents(), [today, future]);
  assert.equal(existsSync(imageFile), false);
  assert.deepEqual(await cleanup(), { today: "2026-10-25", removedEvents: 0, removedPosters: 0, errors: 0 });
});

for (const [instant, kept, expired] of [
  ["2026-03-28T23:30:00Z", "2026-03-29", "2026-03-28"],
  ["2026-03-29T01:30:00Z", "2026-03-29", "2026-03-28"],
  ["2026-10-24T22:30:00Z", "2026-10-25", "2026-10-24"],
  ["2026-10-25T01:30:00Z", "2026-10-25", "2026-10-24"],
  ["2026-12-31T23:30:00Z", "2027-01-01", "2026-12-31"],
]) {
  test(`cleanup uses the Prague date at ${instant}`, async () => {
    await writeFile(eventFile, JSON.stringify([{ ...past, date: expired }, { ...today, date: kept }]));
    const result = await cleanupPastEvents({ root: directory, now: new Date(instant) });
    assert.equal(result.today, kept);
    assert.deepEqual(await readEvents(), [{ ...today, date: kept }]);
  });
}

for (const reference of ["event", "gallery", "source", "symlink"]) {
  test(`cleanup keeps a poster referenced by ${reference}`, async () => {
    if (reference === "event") await writeFile(eventFile, JSON.stringify([past, { ...today, posterPath: past.posterPath }]));
    if (reference === "gallery") await writeFile(join(directory, "src/content/gallery.json"), JSON.stringify([{ src: past.posterPath }]));
    if (reference === "source") await writeFile(join(directory, "src/banner.ts"), `export const image = "${past.posterPath}";`);
    if (reference === "symlink") await symlink("past.jpg", join(directory, "public/posters/alias.jpg"));
    assert.equal((await cleanup()).removedPosters, 0);
    assert.equal(await readFile(imageFile, "utf8"), "poster bytes");
    assert.ok(!(await readEvents()).some((entry) => entry.id === past.id));
  });
}

test("cleanup keeps malformed entries and their references while processing valid past akce", async () => {
  const invalid = { id: "bad", date: "2026-02-30", posterPath: past.posterPath };
  await writeFile(eventFile, JSON.stringify([invalid, past, today, null]));
  assert.deepEqual(await cleanup(), { today: "2026-10-25", removedEvents: 1, removedPosters: 0, errors: 2 });
  assert.deepEqual(await readEvents(), [invalid, today, null]);
  assert.equal(existsSync(imageFile), true);
});

test("cleanup preserves duplicate entries rather than silently discarding them", async () => {
  const duplicate = { ...today, date: "2026-10-23" };
  await writeFile(eventFile, JSON.stringify([today, duplicate, past]));
  assert.equal((await cleanup()).errors, 1);
  assert.deepEqual(await readEvents(), [today, duplicate]);
});

test("cleanup does not remove a poster symlink or its target", async () => {
  await writeFile(join(directory, "public/posters/target.jpg"), "shared target");
  await rm(imageFile);
  await symlink("target.jpg", imageFile);
  assert.equal((await cleanup()).removedPosters, 0);
  assert.equal(await readFile(imageFile, "utf8"), "shared target");
});

test("invalid JSON aborts without deleting a poster", async () => {
  await writeFile(eventFile, "invalid JSON");
  await assert.rejects(cleanup());
  assert.equal(existsSync(imageFile), true);
  assert.equal(await readFile(eventFile, "utf8"), "invalid JSON");
});

function useGithub(t, { entries = [past, today, future], extraFiles = {}, conflict = false, failure = false, truncated = false, unreadable = false, posterMode = "100644", refFailureStatus = 503 } = {}) {
  process.env.VERCEL = "1";
  process.env.VERCEL_ENV = "production";
  process.env.GITHUB_REPOSITORY = "test/band";
  process.env.GITHUB_CONTENTS_TOKEN = "private-github-token";
  process.env.GITHUB_CONTENTS_BRANCH = "content";
  const blobs = new Map();
  let sequence = 0;
  function addBlob(source) {
    const sha = `blob-${++sequence}`;
    blobs.set(sha, source);
    return sha;
  }
  const initial = new Map(Object.entries({
    "src/content/events.json": JSON.stringify(entries), "public/posters/past.jpg": "poster bytes", ...extraFiles,
  }).map(([path, source]) => [path, { path, sha: addBlob(source), type: "blob", mode: path === "public/posters/past.jpg" ? posterMode : "100644" }]));
  const trees = new Map([["tree-initial", initial]]);
  const commits = new Map([["head-initial", "tree-initial"]]);
  let head = "head-initial";
  let publications = 0;
  let writes = 0;
  t.mock.method(globalThis, "fetch", async (input, init = {}) => {
    const url = new URL(input);
    assert.equal(url.origin, "https://api.github.com");
    assert.equal(init.headers.Authorization, "Bearer private-github-token");
    const path = url.pathname.replace("/repos/test/band", "");
    const body = init.body ? JSON.parse(init.body) : undefined;
    if (body) writes += 1;
    if (path === "/git/ref/heads/content") return Response.json({ object: { sha: head } });
    if (path.startsWith("/git/commits/")) return Response.json({ tree: { sha: commits.get(path.split("/").at(-1)) } });
    if (path.startsWith("/git/trees/")) return Response.json({ truncated, tree: [...trees.get(path.split("/").at(-1)).values()] });
    if (path.startsWith("/git/blobs/")) {
      if (unreadable && path !== `/git/blobs/${initial.get("src/content/events.json").sha}`) return Response.json({}, { status: 503 });
      return Response.json({ encoding: "base64", content: Buffer.from(blobs.get(path.split("/").at(-1))).toString("base64") });
    }
    if (path === "/git/blobs") return Response.json({ sha: addBlob(body.encoding === "base64" ? Buffer.from(body.content, "base64").toString("utf8") : body.content) });
    if (path === "/git/trees") {
      const tree = new Map(trees.get(body.base_tree));
      for (const entry of body.tree) {
        if (entry.sha === null) tree.delete(entry.path);
        else tree.set(entry.path, entry);
      }
      const sha = `tree-${++sequence}`;
      trees.set(sha, tree);
      return Response.json({ sha });
    }
    if (path === "/git/commits") {
      const sha = `head-${++sequence}`;
      commits.set(sha, body.tree);
      return Response.json({ sha });
    }
    if (path === "/git/refs/heads/content") {
      assert.equal(body.force, false);
      if (failure) return Response.json({}, { status: refFailureStatus });
      if (conflict) {
        conflict = false;
        const tree = new Map(trees.get(commits.get(head)));
        tree.set("src/content/gallery.json", { path: "src/content/gallery.json", type: "blob", mode: "100644", sha: addBlob(JSON.stringify([{ src: past.posterPath }])) });
        tree.set("src/content/events.json", { path: "src/content/events.json", type: "blob", mode: "100644", sha: addBlob(JSON.stringify([past, { ...today, title: "Souběžná úprava" }, future])) });
        trees.set("tree-concurrent", tree);
        commits.set("head-concurrent", "tree-concurrent");
        head = "head-concurrent";
        return Response.json({ message: "Update is not a fast forward" }, { status: 422 });
      }
      head = body.sha;
      publications += 1;
      return Response.json({ object: { sha: head } });
    }
    assert.fail(`Unexpected GitHub request ${path}`);
  });
  return {
    read(path) { return blobs.get(trees.get(commits.get(head)).get(path)?.sha); },
    get publications() { return publications; },
    get writes() { return writes; },
  };
}

test("production cleanup publishes JSON and unused poster removal in one commit", async (t) => {
  const github = useGithub(t);
  assert.deepEqual(await cleanup(), { today: "2026-10-25", removedEvents: 1, removedPosters: 1, errors: 0 });
  assert.deepEqual(JSON.parse(github.read("src/content/events.json")), [today, future]);
  assert.equal(github.read("public/posters/past.jpg"), undefined);
  assert.equal(github.publications, 1);
  assert.deepEqual(await readEvents(), [past, today, future]);
  assert.equal((await cleanup()).removedEvents, 0);
  assert.equal(github.publications, 1);
});

test("production cleanup recomputes references and keeps other edits after a conflict", async (t) => {
  const github = useGithub(t, { conflict: true });
  assert.equal((await cleanup()).removedPosters, 0);
  assert.deepEqual(JSON.parse(github.read("src/content/events.json")), [{ ...today, title: "Souběžná úprava" }, future]);
  assert.equal(github.read("public/posters/past.jpg"), "poster bytes");
  assert.equal(github.publications, 1);
});

for (const options of [{ failure: true }, { failure: true, refFailureStatus: 409 }, { truncated: true }, { unreadable: true, extraFiles: { "src/banner.ts": "image reference" } }]) {
  test(`failed production cleanup leaves published content unchanged: ${JSON.stringify(options)}`, async (t) => {
    const github = useGithub(t, options);
    await assert.rejects(cleanup());
    assert.deepEqual(JSON.parse(github.read("src/content/events.json")), [past, today, future]);
    assert.equal(github.read("public/posters/past.jpg"), "poster bytes");
    assert.equal(github.publications, 0);
  });
}

for (const extraFiles of [{ "src/content/gallery.json": JSON.stringify([{ src: past.posterPath }]) }, { "public/alias.svg": "<image href='/posters/past.jpg'/>" }]) {
  test(`production cleanup preserves references in ${Object.keys(extraFiles)[0]}`, async (t) => {
    const github = useGithub(t, { extraFiles });
    assert.equal((await cleanup()).removedPosters, 0);
    assert.equal(github.read("public/posters/past.jpg"), "poster bytes");
  });
}

test("production cleanup leaves symlink posters intact", async (t) => {
  const github = useGithub(t, { posterMode: "120000" });
  assert.equal((await cleanup()).removedPosters, 0);
  assert.equal(github.read("public/posters/past.jpg"), "poster bytes");
});

test("production cleanup with no expired akce does not write to GitHub", async (t) => {
  const github = useGithub(t, { entries: [today, future] });
  assert.equal((await cleanup()).removedEvents, 0);
  assert.equal(github.writes, 0);
});

function request(authorization) {
  return new Request("https://band.test/api/cron/events", { headers: authorization ? { authorization } : {} });
}

test("cron rejects missing secrets and invalid authorization without touching storage", async () => {
  for (const secret of [undefined, "cron-test-secret"]) {
    if (secret) process.env.CRON_SECRET = secret;
    else delete process.env.CRON_SECRET;
    for (const header of [undefined, "Bearer undefined", "Bearer wrong", "cron-test-secret"]) {
      assert.equal((await GET(request(header))).status, 401);
    }
  }
  assert.deepEqual(await readEvents(), [past, today, future]);
  assert.equal(existsSync(imageFile), true);
});

test("authorized cron returns and logs cleanup counts without secrets", async (t) => {
  process.env.CRON_SECRET = "cron-test-secret";
  t.mock.timers.enable({ apis: ["Date"], now });
  const logs = [];
  t.mock.method(console, "info", (...args) => logs.push(args));
  const response = await GET(request("Bearer cron-test-secret"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { today: "2026-10-25", removedEvents: 1, removedPosters: 1, errors: 0 });
  assert.equal(logs[0][1].removedEvents, 1);
  assert.doesNotMatch(JSON.stringify(logs), /cron-test-secret/);
});

test("preview cron cannot publish even with valid authorization", async () => {
  process.env.CRON_SECRET = "cron-test-secret";
  process.env.VERCEL = "1";
  process.env.VERCEL_ENV = "preview";
  assert.equal((await GET(request("Bearer cron-test-secret"))).status, 403);
  await assert.rejects(cleanup(), /production/);
  assert.deepEqual(await readEvents(), [past, today, future]);
});

test("cron failure returns a generic error and does not log secret-bearing errors", async (t) => {
  process.env.CRON_SECRET = "cron-test-secret";
  await writeFile(eventFile, '{"cron-test-secret":');
  const logs = [];
  t.mock.method(console, "error", (...args) => logs.push(args));
  const response = await GET(request("Bearer cron-test-secret"));
  assert.equal(response.status, 500);
  assert.doesNotMatch(JSON.stringify([await response.json(), logs]), /cron-test-secret/);
  assert.equal(existsSync(imageFile), true);
});


test("production cleanup preserves malformed entries while removing valid past akce", async (t) => {
  const invalid = { date: "yesterday", posterPath: past.posterPath };
  const github = useGithub(t, { entries: [invalid, past, today] });
  assert.deepEqual(await cleanup(), { today: "2026-10-25", removedEvents: 1, removedPosters: 0, errors: 1 });
  assert.deepEqual(JSON.parse(github.read("src/content/events.json")), [invalid, today]);
  assert.equal(github.read("public/posters/past.jpg"), "poster bytes");
});

test("empty event content produces no commit", async (t) => {
  const github = useGithub(t, { entries: [] });
  assert.deepEqual(await cleanup(), { today: "2026-10-25", removedEvents: 0, removedPosters: 0, errors: 0 });
  assert.equal(github.writes, 0);
});
