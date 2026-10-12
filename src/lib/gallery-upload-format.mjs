/** @type {{ readonly "image/jpeg": readonly ["jpg", "jpeg"]; readonly "image/png": readonly ["png"]; readonly "image/webp": readonly ["webp"] }} */
export const galleryImageTypes = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

const extensionTypes = new Map(
  Object.entries(galleryImageTypes).flatMap(([mimeType, extensions]) =>
    extensions.map((extension) => [extension, mimeType]),
  ),
);
const heicExtensions = new Set(["heic", "heif"]);
const heicMimeTypes = new Set(["image/heic", "image/heif"]);

/**
 * @param {string} fileName
 * @param {string} fileType
 * @returns {keyof typeof galleryImageTypes | "image/heic" | undefined}
 */
export function getGalleryUploadMimeType(fileName, fileType) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const extensionType = extension ? extensionTypes.get(extension) : undefined;
  const isHeicExtension = extension ? heicExtensions.has(extension) : false;
  const normalizedFileType = fileType.toLowerCase();
  const declaredType = Object.hasOwn(galleryImageTypes, normalizedFileType)
    ? normalizedFileType
    : heicMimeTypes.has(normalizedFileType)
      ? "image/heic"
      : undefined;
  const extensionFormat = extensionType ?? (isHeicExtension ? "image/heic" : undefined);

  if (
    normalizedFileType &&
    !declaredType &&
    !(isHeicExtension && normalizedFileType === "application/octet-stream")
  ) {
    return undefined;
  }
  if (declaredType && extensionFormat && declaredType !== extensionFormat) return undefined;

  return declaredType ?? extensionFormat;
}
