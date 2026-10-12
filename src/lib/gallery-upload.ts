import { galleryImageTypes } from "@/lib/gallery-upload-format.mjs";

export const MAX_GALLERY_UPLOAD_BYTES = 3_500_000;

export { galleryImageTypes, getGalleryUploadMimeType } from "@/lib/gallery-upload-format.mjs";

export type GalleryImageMimeType = keyof typeof galleryImageTypes;
