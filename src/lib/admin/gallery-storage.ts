import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { readFile, readdir, readlink, rename, unlink, writeFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import type { GalleryPhotoContent } from "@/lib/content-types";
import { validateGalleryPhotos } from "@/lib/content-validation.mjs";
import type { GalleryImageMimeType } from "@/lib/gallery-upload";

const galleryFilePath = resolve(process.cwd(), "src/content/gallery.json");
const galleryDirectory = resolve(process.cwd(), "public/gallery");
const githubApiVersion = "2026-03-10";
const githubWriteAttempts = 5;
let localGalleryQueue: Promise<void> = Promise.resolve();

type ImageDetails = {
  mimeType: GalleryImageMimeType;
  width: number;
  height: number;
  extension: "jpg" | "png" | "webp";
};

type PreparedGalleryPhoto = {
  bytes: Buffer;
  details: ImageDetails;
  filename: string;
  hash: string;
};

type GithubContent = {
  content?: string;
  encoding?: string;
};

type GithubError = Error & { status?: number; details?: string };

type GithubTreeEntry = {
  path: string;
  mode: string;
  type: string;
  sha: string | null;
};

export class GalleryPhotoNotFoundError extends Error {
  constructor() {
    super("Vybraná fotka už v galerii není. Obnovte stránku.");
    this.name = "GalleryPhotoNotFoundError";
  }
}

export class GalleryUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GalleryUploadValidationError";
  }
}

function usesGithubStorage() {
  return process.env.VERCEL === "1";
}

function getGithubConfiguration() {
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_CONTENTS_TOKEN;

  if (!repository || !/^[^/]+\/[^/]+$/.test(repository) || !token) {
    throw new Error("GitHub content storage is not configured.");
  }

  const [owner, name] = repository.split("/");
  return {
    owner,
    name,
    token,
    branch: process.env.GITHUB_CONTENTS_BRANCH || "main",
  };
}

function githubUrl(path: string) {
  const { owner, name } = getGithubConfiguration();
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}${path}`;
}

async function githubRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { token } = getGithubConfiguration();
  const response = await fetch(githubUrl(path), {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": githubApiVersion,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    const error: GithubError = new Error(
      `GitHub content request failed with status ${response.status}.`,
    );
    error.status = response.status;
    error.details = details;
    throw error;
  }

  return response.json() as Promise<T>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseGallery(source: string): GalleryPhotoContent[] {
  const parsed: unknown = JSON.parse(source);
  const result = validateGalleryPhotos(parsed);

  if (
    result.errors.length > 0 ||
    !Array.isArray(parsed) ||
    result.items.length !== parsed.length
  ) {
    throw new Error("Soubor galerie obsahuje neplatná data. Galerie nebyla změněna.");
  }

  return result.items;
}

function getJpegDimensions(bytes: Buffer) {
  let offset = 2;
  let orientation = 1;

  while (offset + 3 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    offset += 1;

    if (
      marker === 0xd8 ||
      marker === 0xd9 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      continue;
    }

    if (offset + 1 >= bytes.length) break;
    const segmentLength = bytes.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) break;

    if (marker === 0xe1) {
      const exifStart = offset + 2;
      if (bytes.toString("ascii", exifStart, exifStart + 6) === "Exif\0\0") {
        const tiffStart = exifStart + 6;
        const byteOrder = bytes.toString("ascii", tiffStart, tiffStart + 2);
        const isLittleEndian = byteOrder === "II";
        const isBigEndian = byteOrder === "MM";

        if (
          (isLittleEndian || isBigEndian) &&
          tiffStart + 8 <= offset + segmentLength &&
          (isLittleEndian
            ? bytes.readUInt16LE(tiffStart + 2)
            : bytes.readUInt16BE(tiffStart + 2)) === 42
        ) {
          const ifdStart = tiffStart + (isLittleEndian
            ? bytes.readUInt32LE(tiffStart + 4)
            : bytes.readUInt32BE(tiffStart + 4));

          if (ifdStart + 2 <= offset + segmentLength) {
            const entryCount = isLittleEndian
              ? bytes.readUInt16LE(ifdStart)
              : bytes.readUInt16BE(ifdStart);

            for (let index = 0; index < entryCount; index += 1) {
              const entry = ifdStart + 2 + index * 12;
              if (entry + 12 > offset + segmentLength) break;
              const tag = isLittleEndian
                ? bytes.readUInt16LE(entry)
                : bytes.readUInt16BE(entry);
              const fieldType = isLittleEndian
                ? bytes.readUInt16LE(entry + 2)
                : bytes.readUInt16BE(entry + 2);
              const count = isLittleEndian
                ? bytes.readUInt32LE(entry + 4)
                : bytes.readUInt32BE(entry + 4);

              if (tag === 0x0112 && fieldType === 3 && count === 1) {
                orientation = isLittleEndian
                  ? bytes.readUInt16LE(entry + 8)
                  : bytes.readUInt16BE(entry + 8);
                break;
              }
            }
          }
        }
      }
    }

    const isStartOfFrame =
      marker === 0xc0 || marker === 0xc1 || marker === 0xc2 || marker === 0xc3 ||
      marker === 0xc5 || marker === 0xc6 || marker === 0xc7 || marker === 0xc9 ||
      marker === 0xca || marker === 0xcb || marker === 0xcd || marker === 0xce ||
      marker === 0xcf;

    if (isStartOfFrame) {
      if (segmentLength < 8) return undefined;
      const width = bytes.readUInt16BE(offset + 5);
      const height = bytes.readUInt16BE(offset + 3);
      return orientation >= 5 && orientation <= 8
        ? { width: height, height: width }
        : { width, height };
    }

    offset += segmentLength;
  }

  return undefined;
}

function getWebpDimensions(bytes: Buffer) {
  if (
    bytes.length < 25 ||
    bytes.toString("ascii", 0, 4) !== "RIFF" ||
    bytes.toString("ascii", 8, 12) !== "WEBP"
  ) {
    return undefined;
  }

  const chunkType = bytes.toString("ascii", 12, 16);

  if (chunkType === "VP8X") {
    if (bytes.length < 30) return undefined;
    return {
      width: 1 + bytes.readUIntLE(24, 3),
      height: 1 + bytes.readUIntLE(27, 3),
    };
  }

  if (chunkType === "VP8L" && bytes[20] === 0x2f && bytes.length >= 25) {
    const widthMinusOne = bytes[21] | ((bytes[22] & 0x3f) << 8);
    const heightMinusOne = (bytes[22] >> 6) | (bytes[23] << 2) | ((bytes[24] & 0x0f) << 10);
    return { width: widthMinusOne + 1, height: heightMinusOne + 1 };
  }

  if (
    chunkType === "VP8 " &&
    bytes.length >= 30 &&
    bytes[23] === 0x9d &&
    bytes[24] === 0x01 &&
    bytes[25] === 0x2a
  ) {
    return {
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff,
    };
  }

  return undefined;
}

function inspectImage(bytes: Buffer, contentType: string | null): ImageDetails {
  let details: ImageDetails | undefined;

  if (
    bytes.length >= 24 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    bytes.toString("ascii", 12, 16) === "IHDR"
  ) {
    details = {
      mimeType: "image/png",
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
      extension: "png",
    };
  } else if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    const dimensions = getJpegDimensions(bytes);
    if (dimensions) {
      details = { mimeType: "image/jpeg", ...dimensions, extension: "jpg" };
    }
  } else {
    const dimensions = getWebpDimensions(bytes);
    if (dimensions) {
      details = { mimeType: "image/webp", ...dimensions, extension: "webp" };
    }
  }

  if (!details || details.width <= 0 || details.height <= 0) {
    throw new GalleryUploadValidationError("Soubor není platná fotka JPEG, PNG nebo WebP.");
  }
  if (contentType !== details.mimeType) {
    throw new GalleryUploadValidationError("Typ souboru neodpovídá jeho skutečnému obsahu.");
  }

  return details;
}

function createGalleryPhoto(preparedPhoto: PreparedGalleryPhoto, order: number): GalleryPhotoContent {
  return {
    id: `gallery-${preparedPhoto.hash}`,
    src: `/gallery/${preparedPhoto.filename}`,
    order,
    width: preparedPhoto.details.width,
    height: preparedPhoto.details.height,
  };
}

function getNextOrder(photos: GalleryPhotoContent[]) {
  return photos.reduce((next, photo) => Math.max(next, photo.order + 1), 0);
}

function findDuplicate(photos: GalleryPhotoContent[], photo: GalleryPhotoContent) {
  return photos.some((existing) => existing.id === photo.id || existing.src === photo.src);
}

function serializeGallery(photos: GalleryPhotoContent[]) {
  const validation = validateGalleryPhotos(photos);
  if (validation.errors.length > 0 || validation.items.length !== photos.length) {
    throw new Error("Fotka by vytvořila neplatný záznam v galerii.");
  }

  return `${JSON.stringify(photos, null, 2)}\n`;
}

async function writeLocalGallery(photos: GalleryPhotoContent[]) {
  const temporaryPath = `${galleryFilePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, serializeGallery(photos), { flag: "wx" });

  try {
    await rename(temporaryPath, galleryFilePath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

function runLocalGalleryMutation<Result>(mutation: () => Promise<Result>) {
  const result = localGalleryQueue.then(mutation, mutation);
  localGalleryQueue = result.then(() => undefined, () => undefined);
  return result;
}

async function addPhotoLocally(preparedPhoto: PreparedGalleryPhoto) {
  const addPhoto = async () => {
    const gallery = parseGallery(await readFile(galleryFilePath, "utf8"));
    const photo = createGalleryPhoto(preparedPhoto, getNextOrder(gallery));
    if (findDuplicate(gallery, photo)) return { alreadyExists: true };

    const imagePath = resolve(galleryDirectory, preparedPhoto.filename);
    let imageCreated = false;
    try {
      await writeFile(imagePath, preparedPhoto.bytes, { flag: "wx" });
      imageCreated = true;
    } catch (error) {
      if (!isRecord(error) || error.code !== "EEXIST") throw error;
      const existingBytes = await readFile(imagePath);
      if (!existingBytes.equals(preparedPhoto.bytes)) {
        throw new Error("Kolize názvu souboru galerie.");
      }
    }

    try {
      await writeLocalGallery([...gallery, photo]);
    } catch (error) {
      if (imageCreated) await unlink(imagePath).catch(() => undefined);
      throw error;
    }

    return { alreadyExists: false };
  };

  return runLocalGalleryMutation(addPhoto);
}

async function getGithubSnapshot() {
  const { branch } = getGithubConfiguration();
  const encodedBranch = encodeURIComponent(branch);
  const reference = await githubRequest<{ object: { sha: string } }>(
    `/git/ref/heads/${encodedBranch}`,
  );
  const head = reference.object.sha;
  const commit = await githubRequest<{ tree: { sha: string } }>(`/git/commits/${head}`);
  const content = await githubRequest<GithubContent>(
    `/contents/src/content/gallery.json?ref=${encodeURIComponent(head)}`,
  );

  if (content.encoding !== "base64" || typeof content.content !== "string") {
    throw new Error("GitHub nevrátil obsah galerie ve formátu base64.");
  }

  return {
    head,
    tree: commit.tree.sha,
    photos: parseGallery(Buffer.from(content.content, "base64").toString("utf8")),
  };
}

function isConcurrentGithubUpdate(error: unknown) {
  const githubError = error as GithubError;
  return githubError.status === 409 ||
    (githubError.status === 422 &&
      /fast.?forward|reference.*update/i.test(githubError.details ?? ""));
}

async function commitGithubGallery(
  snapshot: Awaited<ReturnType<typeof getGithubSnapshot>>,
  photos: GalleryPhotoContent[],
  imageChanges: GithubTreeEntry[],
  message: string,
) {
  const { branch } = getGithubConfiguration();
  const galleryBlob = await githubRequest<{ sha: string }>("/git/blobs", {
    method: "POST",
    body: JSON.stringify({ content: serializeGallery(photos), encoding: "utf-8" }),
  });
  const tree = await githubRequest<{ sha: string }>("/git/trees", {
    method: "POST",
    body: JSON.stringify({
      base_tree: snapshot.tree,
      tree: [
        ...imageChanges,
        { path: "src/content/gallery.json", mode: "100644", type: "blob", sha: galleryBlob.sha },
      ],
    }),
  });
  const commit = await githubRequest<{ sha: string }>("/git/commits", {
    method: "POST",
    body: JSON.stringify({ message, tree: tree.sha, parents: [snapshot.head] }),
  });
  await githubRequest("/git/refs/heads/" + encodeURIComponent(branch), {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });
}

async function commitGithubPhoto(preparedPhoto: PreparedGalleryPhoto) {
  for (let attempt = 0; attempt < githubWriteAttempts; attempt += 1) {
    const snapshot = await getGithubSnapshot();
    const photo = createGalleryPhoto(preparedPhoto, getNextOrder(snapshot.photos));
    if (findDuplicate(snapshot.photos, photo)) return { alreadyExists: true };

    const photos = [...snapshot.photos, photo];
    const imageBlob = await githubRequest<{ sha: string }>("/git/blobs", {
      method: "POST",
      body: JSON.stringify({
        content: preparedPhoto.bytes.toString("base64"),
        encoding: "base64",
      }),
    });
    try {
      await commitGithubGallery(snapshot, photos, [{
        path: `public/gallery/${preparedPhoto.filename}`,
        mode: "100644", type: "blob", sha: imageBlob.sha,
      }], `Přidat fotku do galerie ${preparedPhoto.filename}`);
      return { alreadyExists: false };
    } catch (error) {
      if (!isConcurrentGithubUpdate(error) || attempt === githubWriteAttempts - 1) throw error;
    }
  }

  throw new Error("Nepodařilo se uložit fotku po souběžných změnách galerie.");
}

const referenceExtensions = new Set([
  ".json", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".html", ".svg",
]);

function canContainImageReference(path: string) {
  return path !== "src/content/gallery.json" &&
    (path.startsWith("src/") || path.startsWith("components/") || path.startsWith("public/") || !path.includes("/")) &&
    referenceExtensions.has(extname(path));
}

function referencesPhoto(source: string, photo: GalleryPhotoContent) {
  const filename = basename(photo.src);
  try {
    source = JSON.stringify(JSON.parse(source));
  } catch {
    // Zdrojový kód a odkazy symbolických souborů nejsou JSON.
  }
  return source.includes(filename) || source.includes(encodeURIComponent(filename));
}

function removeSelectedPhoto(photos: GalleryPhotoContent[], id: string) {
  const photo = photos.find((item) => item.id === id);
  if (!photo) throw new GalleryPhotoNotFoundError();
  return { photo, remaining: photos.filter((item) => item.id !== id) };
}

async function hasLocalImageReference(photo: GalleryPhotoContent) {
  async function search(directory: string): Promise<boolean> {
    const entries = await readdir(resolve(process.cwd(), directory), { withFileTypes: true });
    for (const entry of entries) {
      const path = directory ? `${directory}/${entry.name}` : entry.name;
      if (entry.isDirectory() && ["src", "components", "public"].some((root) => path === root || path.startsWith(`${root}/`))) {
        if (await search(path)) return true;
      } else if (entry.isFile() && canContainImageReference(path)) {
        if (referencesPhoto(await readFile(resolve(process.cwd(), path), "utf8"), photo)) return true;
      } else if (entry.isSymbolicLink()) {
        if (referencesPhoto(await readlink(resolve(process.cwd(), path)), photo)) return true;
      }
    }
    return false;
  }
  return search("");
}

async function deletePhotoLocally(id: string) {
  const deletePhoto = async () => {
    const photos = parseGallery(await readFile(galleryFilePath, "utf8"));
    const { photo, remaining } = removeSelectedPhoto(photos, id);
    const keepImage = remaining.some((item) => item.src === photo.src) || await hasLocalImageReference(photo);
    await writeLocalGallery(remaining);
    if (!keepImage) {
      try {
        await unlink(resolve(galleryDirectory, basename(photo.src)));
      } catch (error) {
        if (!isRecord(error) || error.code !== "ENOENT") {
          await writeLocalGallery(photos);
          throw error;
        }
      }
    }
  };
  await runLocalGalleryMutation(deletePhoto);
}

async function commitGithubPhotoDeletion(id: string) {
  for (let attempt = 0; attempt < githubWriteAttempts; attempt += 1) {
    const snapshot = await getGithubSnapshot();
    const { photo, remaining } = removeSelectedPhoto(snapshot.photos, id);
    const tree = await githubRequest<{ tree: GithubTreeEntry[]; truncated: boolean }>(
      `/git/trees/${snapshot.tree}?recursive=1`,
    );
    if (tree.truncated) throw new Error("GitHub vrátil neúplný seznam souborů. Fotka nebyla smazána.");
    let keepImage = remaining.some((item) => item.src === photo.src);
    const referenceFiles = tree.tree.filter((entry) => entry.type === "blob" &&
      (canContainImageReference(entry.path) || entry.mode === "120000"));
    for (let offset = 0; !keepImage && offset < referenceFiles.length; offset += 8) {
      const references = await Promise.all(referenceFiles.slice(offset, offset + 8).map(async (entry) => {
        const blob = await githubRequest<GithubContent>(`/git/blobs/${entry.sha}`);
        if (blob.encoding !== "base64" || typeof blob.content !== "string") {
          throw new Error("Nepodařilo se ověřit odkazy na fotku. Galerie nebyla změněna.");
        }
        return referencesPhoto(Buffer.from(blob.content, "base64").toString("utf8"), photo);
      }));
      keepImage = references.some(Boolean);
    }
    const imagePath = `public${photo.src}`;
    const image = tree.tree.find((entry) => entry.path === imagePath);
    const imageChanges: GithubTreeEntry[] = !keepImage && image
      ? [{ path: imagePath, mode: image.mode, type: "blob", sha: null }]
      : [];
    try {
      await commitGithubGallery(snapshot, remaining, imageChanges, `Smazat fotku galerie ${id}`);
      return;
    } catch (error) {
      if (!isConcurrentGithubUpdate(error) || attempt === githubWriteAttempts - 1) throw error;
    }
  }
}

export async function deleteManagedGalleryPhoto(id: string) {
  if (usesGithubStorage()) await commitGithubPhotoDeletion(id);
  else await deletePhotoLocally(id);
  return {
    id,
    message: usesGithubStorage()
      ? "Fotka je odebraná. Z veřejného webu zmizí po dokončení nasazení."
      : "Fotka je smazaná z galerie.",
  };
}

export async function addManagedGalleryPhoto(bytes: Buffer, contentType: string | null) {
  const details = inspectImage(bytes, contentType);
  const hash = createHash("sha256").update(bytes).digest("hex");
  const filename = `${hash}.${details.extension}`;
  const preparedPhoto = { bytes, details, filename, hash };
  const uploadResult = usesGithubStorage()
    ? await commitGithubPhoto(preparedPhoto)
    : await addPhotoLocally(preparedPhoto);

  return {
    ...uploadResult,
    path: `/gallery/${filename}`,
    message: usesGithubStorage()
      ? uploadResult.alreadyExists
        ? "Tato fotka už v galerii je."
        : "Fotka je uložená. Na webu se zobrazí po dokončení nasazení."
      : uploadResult.alreadyExists
        ? "Tato fotka už v galerii je."
        : "Fotka je uložená v galerii.",
  };
}
