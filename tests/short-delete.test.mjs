import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire, registerHooks } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test, { after, beforeEach } from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { signAdminSession } from "../src/lib/admin/session-crypto.mjs";

const repository = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const previousDirectory = process.cwd();
const directory = await mkdtemp(join(tmpdir(), "short-delete-api-"));
const secret = Buffer.alloc(32, 1).toString("base64url");
const originalEnv = { ...process.env };

const first = { id: "first", videoId: "iDQUGjGwNrs", order: 8 };
const selected = { id: "selected", videoId: "N5wYJKatssw", order: 1 };
const last = { id: "last", videoId: "kZdWxsTCQ5o", order: 3 };
const initialVideos = [first, selected, last];

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (["server-only", "next/headers", "next/cache"].includes(specifier)) {
      return { url: `short-api-test:${specifier}`, shortCircuit: true };
    }
    if (specifier === "next/server") {
      return nextResolve(pathToFileURL(require.resolve(specifier)).href, context);
    }
    if (specifier.startsWith("@/")) {
      specifier = pathToFileURL(join(repository, "src", specifier.slice(2))).href;
    }
    if (specifier.startsWith("file:") || specifier.startsWith(".")) {
      const url = new URL(specifier, context.parentURL);
      for (const extension of [".ts", ".tsx"]) {
        if (existsSync(fileURLToPath(`${url.href}${extension}`))) {
          return { url: `${url.href}${extension}`, shortCircuit: true };
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    const runtimeModules = {
      "short-api-test:server-only": "export {};",
      "short-api-test:next/headers": `
        export async function cookies() {
          return { get(name) {
            return name === "admin_session" && globalThis.shortApiTestCookie
              ? { value: globalThis.shortApiTestCookie } : undefined;
          } };
        }`,
      "short-api-test:next/cache": `
        export function revalidatePath(path) { globalThis.shortApiTestRevalidations.push(path); }`,
    };
    if (Object.hasOwn(runtimeModules, url)) {
      return { format: "module", source: runtimeModules[url], shortCircuit: true };
    }
    if (url.endsWith("/src/content/shorts.json")) {
      return { format: "module", source: `export default ${JSON.stringify(initialVideos)};`, shortCircuit: true };
    }
    if (/\.tsx?$/.test(url)) {
      const source = ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
        fileName: fileURLToPath(url),
      }).outputText;
      return { format: "module", source, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

process.chdir(directory);
const { DELETE } = await import("../src/app/api/admin/shorts/route.ts");
const { default: VideosSection } = await import("../components/sections/VideosSection.tsx");
const { default: ShortVideoDelete } = await import("../src/app/admin/ShortVideoDelete.tsx");
const shortsFile = join(directory, "src/content/shorts.json");

beforeEach(async () => {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("GITHUB_") || key.startsWith("VERCEL") || key === "ADMIN_SESSION_SECRET") delete process.env[key];
  }
  process.env.ADMIN_SESSION_SECRET = secret;
  globalThis.shortApiTestCookie = undefined;
  globalThis.shortApiTestRevalidations = [];
  await mkdir(join(directory, "src/content"), { recursive: true });
  await writeFile(shortsFile, JSON.stringify(initialVideos));
});

after(async () => {
  hooks.deregister();
  process.chdir(previousDirectory);
  process.env = originalEnv;
  delete globalThis.shortApiTestCookie;
  delete globalThis.shortApiTestRevalidations;
  await rm(directory, { recursive: true, force: true });
});

function deleteRequest(body = { id: selected.id }) {
  return new Request("http://localhost/api/admin/shorts", {
    method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

async function readVideos() {
  return JSON.parse(await readFile(shortsFile, "utf8"));
}

test("anonymous short video deletion is refused without changing content", async () => {
  const response = await DELETE(deleteRequest());
  assert.equal(response.status, 401);
  assert.deepEqual(await readVideos(), initialVideos);
  assert.deepEqual(globalThis.shortApiTestRevalidations, []);
});

test("authenticated deletion removes only the selected video without changing other records or their order", async () => {
  globalThis.shortApiTestCookie = signAdminSession(secret);
  const response = await DELETE(deleteRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id: "selected", message: "Krátké video je smazané z webu." });
  assert.deepEqual(await readVideos(), [first, last]);
  assert.deepEqual(globalThis.shortApiTestRevalidations, ["/", "/admin"]);
});

for (const [id, status] of [["missing", 404], ["", 400], [null, 400], [42, 400]]) {
  test(`deletion rejects invalid or missing short video ID ${JSON.stringify(id)} without changing content`, async () => {
    globalThis.shortApiTestCookie = signAdminSession(secret);
    const response = await DELETE(deleteRequest({ id }));
    assert.equal(response.status, status);
    assert.deepEqual(await readVideos(), initialVideos);
    assert.deepEqual(globalThis.shortApiTestRevalidations, []);
  });
}

function useGithubRepository(t, { failPublication = false, concurrentEdit = false } = {}) {
  process.env.VERCEL = "1";
  process.env.VERCEL_ENV = "production";
  process.env.GITHUB_REPOSITORY = "test/band";
  process.env.GITHUB_CONTENTS_TOKEN = "test-token";
  process.env.GITHUB_CONTENTS_BRANCH = "content";
  let videos = initialVideos;
  let sha = "initial-sha";
  const added = { id: "added", videoId: "jN81OZ1XY74", order: 10 };
  const commits = [];

  t.mock.method(globalThis, "fetch", async (input, init = {}) => {
    const url = new URL(input);
    assert.equal(url.origin, "https://api.github.com");
    assert.equal(url.pathname, "/repos/test/band/contents/src/content/shorts.json");
    assert.equal(url.searchParams.get("ref"), "content");
    assert.equal(init.headers.Authorization, "Bearer test-token");
    if (init.method === "GET") {
      return Response.json({ sha, encoding: "base64", content: Buffer.from(JSON.stringify(videos)).toString("base64") });
    }
    assert.equal(init.method, "PUT");
    const body = JSON.parse(init.body);
    assert.equal(body.branch, "content");
    if (failPublication) return Response.json({ message: "Service unavailable" }, { status: 503 });
    if (concurrentEdit) {
      concurrentEdit = false;
      videos = [first, selected, last, added];
      sha = "concurrent-sha";
    }
    if (body.sha !== sha) return Response.json({ message: "Conflict" }, { status: 409 });
    videos = JSON.parse(Buffer.from(body.content, "base64").toString("utf8"));
    commits.push(body.message);
    sha = "updated-sha";
    return Response.json({ commit: { sha }, content: { sha } });
  });
  return { read: () => videos, commits, added };
}

test("production deletion commits only the selected removal to GitHub and leaves the local file unchanged", async (t) => {
  globalThis.shortApiTestCookie = signAdminSession(secret);
  const github = useGithubRepository(t);
  const response = await DELETE(deleteRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    id: "selected", message: "Krátké video je odebrané. Z veřejného webu zmizí po dokončení nasazení.",
  });
  assert.deepEqual(github.read(), [first, last]);
  assert.deepEqual(github.commits, ["Smazat krátké video selected"]);
  assert.deepEqual(await readVideos(), initialVideos);
});

test("production deletion preserves concurrent changes when retrying a GitHub conflict", async (t) => {
  globalThis.shortApiTestCookie = signAdminSession(secret);
  const github = useGithubRepository(t, { concurrentEdit: true });
  const response = await DELETE(deleteRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(github.read(), [first, last, github.added]);
  assert.equal(github.commits.length, 1);
});

test("failed production publication reports failure and leaves all videos unchanged", async (t) => {
  globalThis.shortApiTestCookie = signAdminSession(secret);
  t.mock.method(console, "error", () => {});
  const github = useGithubRepository(t, { failPublication: true });
  const response = await DELETE(deleteRequest());
  assert.equal(response.status, 500);
  assert.deepEqual(github.read(), initialVideos);
  assert.deepEqual(github.commits, []);
  assert.deepEqual(await readVideos(), initialVideos);
  assert.deepEqual(globalThis.shortApiTestRevalidations, []);
});

test("preview deployments reject short video deletion before any GitHub write", async (t) => {
  globalThis.shortApiTestCookie = signAdminSession(secret);
  process.env.VERCEL = "1";
  process.env.VERCEL_ENV = "preview";
  t.mock.method(globalThis, "fetch", () => assert.fail("Preview must not contact GitHub"));
  const response = await DELETE(deleteRequest());
  assert.equal(response.status, 403);
  assert.deepEqual(await readVideos(), initialVideos);
});

test("short video delete controls are rendered for every video only for a správce", () => {
  const visitor = renderToStaticMarkup(createElement(VideosSection, { isAdmin: false }));
  const admin = renderToStaticMarkup(createElement(VideosSection, { isAdmin: true }));
  assert.doesNotMatch(visitor, /aria-label="Smazat krátké video/);
  const deleteControls = [...admin.matchAll(/aria-label="Smazat krátké video (\d+)"/g)];
  assert.deepEqual(deleteControls.map((match) => match[1]), ["1", "2", "3"]);
});

test("deletion confirmation identifies the selected short video with its thumbnail and YouTube link", () => {
  const html = renderToStaticMarkup(createElement(ShortVideoDelete, {
    video: selected, onClose() {}, onDeleted() {},
  }));
  assert.match(html, /Smazat krátké video\?/);
  assert.match(html, /src="https:\/\/i.ytimg.com\/vi\/N5wYJKatssw\/oardefault.jpg"/);
  assert.match(html, /href="https:\/\/www.youtube.com\/shorts\/N5wYJKatssw"/);
  assert.match(html, />Zrušit<\/button>/);
});
