import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

const limit = 250_000_000;
const projectRoot = process.cwd();

async function findTraces(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const traces = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? findTraces(path) : path.endsWith(".nft.json") ? [path] : [];
  }));
  return traces.flat();
}

const traces = await findTraces(resolve(projectRoot, ".next/server/app"));
if (traces.length === 0) throw new Error("No server function traces found. Run next build first.");

let failed = false;
let totalBytes = 0;
for (const trace of traces) {
  const { files } = JSON.parse(await readFile(trace, "utf8"));
  const paths = new Set([trace.slice(0, -".nft.json".length), ...files.map((file) => resolve(dirname(trace), file))]);
  let bytes = 0;
  let publicFiles = 0;
  for (const path of paths) {
    bytes += (await stat(path)).size;
    if (relative(projectRoot, path).startsWith("public/")) publicFiles += 1;
  }
  totalBytes += bytes;
  const route = relative(resolve(projectRoot, ".next/server/app"), trace).replace(/(^|\/)(page|route)\.js\.nft\.json$/, "") || "/";
  console.log(`${route}: ${(bytes / 1_000_000).toFixed(1)} MB, ${publicFiles} public files`);
  if (bytes >= limit || publicFiles > 0) {
    console.error(`${route}: Server functions must stay below 250 MB and exclude public assets.`);
    failed = true;
  }
}
console.log(`Total traced server bundles: ${(totalBytes / 1_000_000).toFixed(1)} MB (shared files counted per route).`);
if (failed) process.exitCode = 1;
