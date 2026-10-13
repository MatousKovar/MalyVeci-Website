import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire, registerHooks } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test, { after, beforeEach } from "node:test";
import ts from "typescript";
import { signAdminSession } from "../src/lib/admin/session-crypto.mjs";

const repository = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const previousDirectory = process.cwd();
const directory = await mkdtemp(join(tmpdir(), "gallery-delete-api-"));
const secret = Buffer.alloc(32, 1).toString("base64url");
const originalEnv = { ...process.env };

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (["server-only", "next/headers", "next/cache"].includes(specifier)) {
      return { url: `gallery-api-test:${specifier}`, shortCircuit: true };
    }
    if (specifier === "next/server") {
      return nextResolve(pathToFileURL(require.resolve(specifier)).href, context);
    }
    if (specifier.startsWith("@/")) {
      specifier = pathToFileURL(join(repository, "src", specifier.slice(2))).href;
    }
    if (specifier.startsWith("file:") || specifier.startsWith(".")) {
      const url = new URL(specifier, context.parentURL);
      if (existsSync(fileURLToPath(`${url.href}.ts`))) {
        return { url: `${url.href}.ts`, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    const runtimeModules = {
      "gallery-api-test:server-only": "export {};",
      "gallery-api-test:next/headers": `
        export async function cookies() {
          return { get(name) {
            return name === "admin_session" && globalThis.galleryApiTestCookie
              ? { value: globalThis.galleryApiTestCookie } : undefined;
          } };
        }`,
      "gallery-api-test:next/cache": `
        export function revalidatePath(path) { globalThis.galleryApiTestRevalidations.push(path); }`,
    };
    if (Object.hasOwn(runtimeModules, url)) {
      return { format: "module", source: runtimeModules[url], shortCircuit: true };
    }
    if (url.endsWith(".ts")) {
      const source = ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
        fileName: fileURLToPath(url),
      }).outputText;
      return { format: "module", source, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

process.chdir(directory);
const { DELETE } = await import("../src/app/api/admin/gallery/route.ts");
const selected = { id: "selected", src: "/gallery/selected.jpg", order: 0, width: 100, height: 80 };
const other = { id: "other", src: "/gallery/other.jpg", order: 1, width: 100, height: 80 };

beforeEach(async () => {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("GITHUB_") || key.startsWith("VERCEL") || key === "ADMIN_SESSION_SECRET") delete process.env[key];
  }
  process.env.ADMIN_SESSION_SECRET = secret;
  globalThis.galleryApiTestCookie = undefined;
  globalThis.galleryApiTestRevalidations = [];
  await rm(join(directory, "src"), { recursive: true, force: true });
  await rm(join(directory, "public"), { recursive: true, force: true });
  await mkdir(join(directory, "src/content"), { recursive: true });
  await mkdir(join(directory, "public/gallery"), { recursive: true });
  await writeFile(join(directory, "src/content/gallery.json"), JSON.stringify([selected, other]));
  await writeFile(join(directory, "src/content/events.json"), "[]");
  await writeFile(join(directory, "public/gallery/selected.jpg"), "selected image");
  await writeFile(join(directory, "public/gallery/other.jpg"), "other image");
});

after(async () => {
  hooks.deregister();
  process.chdir(previousDirectory);
  process.env = originalEnv;
  delete globalThis.galleryApiTestCookie;
  delete globalThis.galleryApiTestRevalidations;
  await rm(directory, { recursive: true, force: true });
});

function deleteRequest(body = { id: selected.id }) {
  return new Request("http://localhost/api/admin/gallery", {
    method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

test("anonymous gallery deletion is refused without changing content", async () => {
  const response = await DELETE(deleteRequest());
  assert.equal(response.status, 401);
  assert.deepEqual(JSON.parse(await readFile(join(directory, "src/content/gallery.json"), "utf8")), [selected, other]);
  assert.equal(await readFile(join(directory, "public/gallery/selected.jpg"), "utf8"), "selected image");
  assert.deepEqual(globalThis.galleryApiTestRevalidations, []);
});

test("authenticated gallery deletion removes only the selected photo and its unused file", async () => {
  globalThis.galleryApiTestCookie = signAdminSession(secret);
  const response = await DELETE(deleteRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id: "selected", message: "Fotka je smazaná z galerie." });
  assert.deepEqual(JSON.parse(await readFile(join(directory, "src/content/gallery.json"), "utf8")), [other]);
  assert.equal(existsSync(join(directory, "public/gallery/selected.jpg")), false);
  assert.equal(await readFile(join(directory, "public/gallery/other.jpg"), "utf8"), "other image");
  assert.deepEqual(globalThis.galleryApiTestRevalidations, ["/", "/admin"]);
});

test("gallery deletion preserves an image used by another gallery photo", async () => {
  globalThis.galleryApiTestCookie = signAdminSession(secret);
  const shared = { ...other, src: selected.src };
  await writeFile(join(directory, "src/content/gallery.json"), JSON.stringify([selected, shared]));
  const response = await DELETE(deleteRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(await readFile(join(directory, "src/content/gallery.json"), "utf8")), [shared]);
  assert.equal(await readFile(join(directory, "public/gallery/selected.jpg"), "utf8"), "selected image");
});

test("gallery deletion preserves an image referenced by another part of the website", async () => {
  globalThis.galleryApiTestCookie = signAdminSession(secret);
  await writeFile(join(directory, "src/content/events.json"), JSON.stringify([
    { id: "event", title: "Akce", date: "2026-12-01", location: "Strakonice", posterPath: selected.src },
  ]));
  const response = await DELETE(deleteRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(await readFile(join(directory, "src/content/gallery.json"), "utf8")), [other]);
  assert.equal(await readFile(join(directory, "public/gallery/selected.jpg"), "utf8"), "selected image");
});

test("failed gallery writes return an error and preserve the photo", async (t) => {
  globalThis.galleryApiTestCookie = signAdminSession(secret);
  t.mock.method(console, "error", () => {});
  const contentDirectory = join(directory, "src/content");
  await chmod(contentDirectory, 0o500);
  try {
    const response = await DELETE(deleteRequest());
    assert.equal(response.status, 500);
    assert.equal((await response.json()).message, "Fotku se nepodařilo smazat. Zkuste to znovu.");
    assert.deepEqual(JSON.parse(await readFile(join(contentDirectory, "gallery.json"), "utf8")), [selected, other]);
    assert.equal(await readFile(join(directory, "public/gallery/selected.jpg"), "utf8"), "selected image");
    assert.deepEqual(globalThis.galleryApiTestRevalidations, []);
  } finally {
    await chmod(contentDirectory, 0o700);
  }
});

test("failed image removal restores the gallery entry and keeps the image", async (t) => {
  globalThis.galleryApiTestCookie = signAdminSession(secret);
  t.mock.method(console, "error", () => {});
  const imageDirectory = join(directory, "public/gallery");
  await chmod(imageDirectory, 0o500);
  try {
    const response = await DELETE(deleteRequest());
    assert.equal(response.status, 500);
    assert.deepEqual(JSON.parse(await readFile(join(directory, "src/content/gallery.json"), "utf8")), [selected, other]);
    assert.equal(await readFile(join(imageDirectory, "selected.jpg"), "utf8"), "selected image");
    assert.deepEqual(globalThis.galleryApiTestRevalidations, []);
  } finally {
    await chmod(imageDirectory, 0o700);
  }
});

function useGithubRepository(t, { failPublication = false, concurrentPoster = false } = {}) {
  process.env.VERCEL = "1";
  process.env.VERCEL_ENV = "production";
  process.env.GITHUB_REPOSITORY = "test/band";
  process.env.GITHUB_CONTENTS_TOKEN = "test-token";
  process.env.GITHUB_CONTENTS_BRANCH = "main";
  const blobs = new Map([
    ["gallery", JSON.stringify([selected, other])],
    ["events", "[]"],
    ["selected-image", "selected image"],
    ["other-image", "other image"],
  ]);
  const initialTree = new Map([
    ["src/content/gallery.json", "gallery"],
    ["src/content/events.json", "events"],
    ["public/gallery/selected.jpg", "selected-image"],
    ["public/gallery/other.jpg", "other-image"],
  ]);
  const trees = new Map([["initial-tree", initialTree]]);
  const commits = new Map([["initial-head", "initial-tree"]]);
  let head = "initial-head";
  let sequence = 0;

  const encodedBlob = (sha) => ({ encoding: "base64", content: Buffer.from(blobs.get(sha)).toString("base64") });
  t.mock.method(globalThis, "fetch", async (input, init = {}) => {
    const url = new URL(input);
    assert.equal(url.origin, "https://api.github.com");
    const path = url.pathname.replace("/repos/test/band", "");
    const body = init.body ? JSON.parse(init.body) : undefined;
    if (path === "/git/ref/heads/main") return Response.json({ object: { sha: head } });
    if (path.startsWith("/git/commits/")) return Response.json({ tree: { sha: commits.get(path.split("/").at(-1)) } });
    if (path === "/contents/src/content/gallery.json") {
      const tree = trees.get(commits.get(url.searchParams.get("ref")));
      return Response.json(encodedBlob(tree.get("src/content/gallery.json")));
    }
    if (path.startsWith("/git/trees/")) {
      const tree = trees.get(path.split("/").at(-1));
      return Response.json({ truncated: false, tree: [...tree].map(([path, sha]) => ({ path, sha, type: "blob", mode: "100644" })) });
    }
    if (path.startsWith("/git/blobs/")) return Response.json(encodedBlob(path.split("/").at(-1)));
    if (path === "/git/blobs" && init.method === "POST") {
      const sha = `blob-${++sequence}`;
      blobs.set(sha, body.content);
      return Response.json({ sha });
    }
    if (path === "/git/trees" && init.method === "POST") {
      const tree = new Map(trees.get(body.base_tree));
      for (const entry of body.tree) {
        if (entry.sha === null) tree.delete(entry.path);
        else tree.set(entry.path, entry.sha);
      }
      const sha = `tree-${++sequence}`;
      trees.set(sha, tree);
      return Response.json({ sha });
    }
    if (path === "/git/commits" && init.method === "POST") {
      const sha = `commit-${++sequence}`;
      commits.set(sha, body.tree);
      return Response.json({ sha });
    }
    if (path === "/git/refs/heads/main" && init.method === "PATCH") {
      assert.equal(body.force, false);
      if (failPublication) return Response.json({ message: "Service unavailable" }, { status: 503 });
      if (concurrentPoster) {
        concurrentPoster = false;
        blobs.set("concurrent-events", JSON.stringify([
          { id: "event", title: "Akce", date: "2026-12-01", location: "Strakonice", posterPath: selected.src },
        ]));
        const tree = new Map(trees.get(commits.get(head)));
        tree.set("src/content/events.json", "concurrent-events");
        trees.set("concurrent-tree", tree);
        commits.set("concurrent-head", "concurrent-tree");
        head = "concurrent-head";
        return Response.json({ message: "Update is not a fast forward" }, { status: 422 });
      }
      head = body.sha;
      return Response.json({ object: { sha: head } });
    }
    assert.fail(`Unexpected GitHub request: ${init.method || "GET"} ${path}`);
  });
  return {
    read(path) { return blobs.get(trees.get(commits.get(head)).get(path)); },
  };
}

test("production gallery deletion publishes the JSON and image removal together", async (t) => {
  globalThis.galleryApiTestCookie = signAdminSession(secret);
  const github = useGithubRepository(t);
  const response = await DELETE(deleteRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    id: "selected", message: "Fotka je odebraná. Z veřejného webu zmizí po dokončení nasazení.",
  });
  assert.deepEqual(JSON.parse(github.read("src/content/gallery.json")), [other]);
  assert.equal(github.read("public/gallery/selected.jpg"), undefined);
  assert.equal(github.read("public/gallery/other.jpg"), "other image");
  assert.deepEqual(JSON.parse(await readFile(join(directory, "src/content/gallery.json"), "utf8")), [selected, other]);
});

test("failed production publication leaves the gallery and image unchanged", async (t) => {
  globalThis.galleryApiTestCookie = signAdminSession(secret);
  t.mock.method(console, "error", () => {});
  const github = useGithubRepository(t, { failPublication: true });
  const response = await DELETE(deleteRequest());
  assert.equal(response.status, 500);
  assert.deepEqual(JSON.parse(github.read("src/content/gallery.json")), [selected, other]);
  assert.equal(github.read("public/gallery/selected.jpg"), "selected image");
  assert.deepEqual(globalThis.galleryApiTestRevalidations, []);
});

test("production deletion preserves an image referenced during a concurrent update", async (t) => {
  globalThis.galleryApiTestCookie = signAdminSession(secret);
  const github = useGithubRepository(t, { concurrentPoster: true });
  const response = await DELETE(deleteRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(github.read("src/content/gallery.json")), [other]);
  assert.equal(github.read("public/gallery/selected.jpg"), "selected image");
  assert.equal(JSON.parse(github.read("src/content/events.json"))[0].posterPath, "/gallery/selected.jpg");
});
