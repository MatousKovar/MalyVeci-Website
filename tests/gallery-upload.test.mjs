import assert from "node:assert/strict";
import test from "node:test";
import { getGalleryUploadMimeType } from "../src/lib/gallery-upload-format.mjs";

test("gallery uploads recognize supported images and HEIC/HEIF files", () => {
  assert.equal(getGalleryUploadMimeType("photo.JPG", "image/jpeg"), "image/jpeg");
  assert.equal(getGalleryUploadMimeType("photo.HEIC", "image/heic"), "image/heic");
  assert.equal(getGalleryUploadMimeType("photo.heif", "image/heif"), "image/heic");
  assert.equal(getGalleryUploadMimeType("photo.heic", ""), "image/heic");
  assert.equal(getGalleryUploadMimeType("photo.heif", "application/octet-stream"), "image/heic");
  assert.equal(getGalleryUploadMimeType("photo", "image/heic-sequence"), undefined);
  assert.equal(getGalleryUploadMimeType("photo", "image/heif-sequence"), undefined);
  assert.equal(getGalleryUploadMimeType("photo.heics", ""), undefined);
  assert.equal(getGalleryUploadMimeType("photo.heifs", ""), undefined);
});

test("gallery uploads reject unsupported and mismatched file types", () => {
  assert.equal(getGalleryUploadMimeType("photo.jpg", "image/heic"), undefined);
  assert.equal(getGalleryUploadMimeType("photo.heic", "image/jpeg"), undefined);
  assert.equal(getGalleryUploadMimeType("photo.gif", "image/gif"), undefined);
  assert.equal(getGalleryUploadMimeType("photo.bin", "application/octet-stream"), undefined);
});
