export const MAX_GALLERY_UPLOAD_BYTES = 3_500_000;

export const galleryImageTypes = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
} as const;

export type GalleryImageMimeType = keyof typeof galleryImageTypes;
