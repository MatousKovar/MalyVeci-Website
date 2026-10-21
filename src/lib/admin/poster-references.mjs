import { readFile, readdir, readlink } from "node:fs/promises";
import { basename, extname, resolve, sep } from "node:path";
import { eventsPath } from "./event-file.mjs";

export const textExtensions = new Set([".json", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".html", ".svg", ".md"]);

export function references(source, imagePath) {
  try { source = JSON.stringify(JSON.parse(source)); } catch { /* Plain text */ }
  const filename = basename(imagePath);
  return source.includes(filename) || source.includes(encodeURIComponent(filename));
}

export function publicFile(root, imagePath) {
  if (typeof imagePath !== "string" || !imagePath.startsWith("/") || imagePath.startsWith("//") || /[\\%?#]/.test(imagePath) || imagePath.split("/").some((part) => part === ".." || part === ".")) return undefined;
  const directory = resolve(root, "public");
  const file = resolve(directory, `.${imagePath}`);
  return file.startsWith(`${directory}${sep}`) ? file : undefined;
}

export async function localHasReference(root, imagePath) {
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

