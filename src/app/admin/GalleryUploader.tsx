"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  getGalleryUploadMimeType,
  MAX_GALLERY_UPLOAD_BYTES,
  type GalleryImageMimeType,
} from "@/lib/gallery-upload";

type UploadStatus = "waiting" | "preparing" | "uploading" | "success" | "error";

type GalleryUploadItem = {
  key: string;
  file: File;
  status: UploadStatus;
  progress: number;
  message: string;
};

type UploadResponse = { message?: string };

const HEIC_INPUT_MIME_TYPE = "image/heic";

function getSupportedMimeType(file: File): GalleryImageMimeType | typeof HEIC_INPUT_MIME_TYPE | undefined {
  return getGalleryUploadMimeType(file.name, file.type);
}

function validateSelectedFile(file: File) {
  if (!getSupportedMimeType(file)) {
    return "Nepodporovaný typ. Vyberte fotku JPEG, PNG, WebP, HEIC nebo HEIF.";
  }
  if (file.size === 0) return "Soubor je prázdný.";
  return undefined;
}

async function convertHeicToJpeg(file: File) {
  let jpeg: Blob;
  try {
    const { heicTo, isHeic } = await import("heic-to");
    if (!(await isHeic(file))) throw new Error("Vybraný soubor není HEIC/HEIF.");
    jpeg = await heicTo({ blob: file, type: "image/jpeg", quality: 0.92 });
  } catch {
    throw new Error("HEIC/HEIF fotku se nepodařilo převést. Zkuste ji uložit jako JPEG.");
  }

  if (!jpeg || jpeg.type !== "image/jpeg" || jpeg.size === 0) {
    throw new Error("HEIC/HEIF fotku se nepodařilo převést. Zkuste ji uložit jako JPEG.");
  }

  return jpeg;
}

function updateCanvasBlob(
  canvas: HTMLCanvasElement,
  quality: number,
  mimeType: "image/jpeg" | "image/webp",
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.type !== mimeType) {
          reject(new Error("Prohlížeč nedokáže připravit fotku k nahrání."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

async function prepareImage(file: Blob, resizedMimeType: "image/jpeg" | "image/webp") {
  let image: ImageBitmap | HTMLImageElement;
  if (typeof createImageBitmap === "function") {
    try {
      image = await createImageBitmap(file);
    } catch {
      throw new Error("Soubor nejde otevřít jako fotka JPEG, PNG nebo WebP.");
    }
  } else {
    image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const previewUrl = URL.createObjectURL(file);
      const fallbackImage = new Image();
      fallbackImage.onload = () => {
        URL.revokeObjectURL(previewUrl);
        resolve(fallbackImage);
      };
      fallbackImage.onerror = () => {
        URL.revokeObjectURL(previewUrl);
        reject(new Error("Soubor nejde otevřít jako fotka JPEG, PNG nebo WebP."));
      };
      fallbackImage.src = previewUrl;
    });
  }

  const width = "naturalWidth" in image ? image.naturalWidth : image.width;
  const height = "naturalHeight" in image ? image.naturalHeight : image.height;
  if (width <= 0 || height <= 0) {
    if ("close" in image) image.close();
    throw new Error("Fotka má neplatné rozměry.");
  }
  if (file.size <= MAX_GALLERY_UPLOAD_BYTES && Math.max(width, height) <= 2800) {
    if ("close" in image) image.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  let scale = Math.min(1, 2800 / Math.max(width, height));
  const qualities = [0.9, 0.84, 0.78, 0.72, 0.66];

  try {
    for (let resizeAttempt = 0; resizeAttempt < 5; resizeAttempt += 1) {
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Fotku se nepodařilo připravit v prohlížeči.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      for (const quality of qualities) {
        const blob = await updateCanvasBlob(canvas, quality, resizedMimeType);
        if (blob.size <= MAX_GALLERY_UPLOAD_BYTES) return blob;
      }

      scale *= 0.8;
    }
  } finally {
    if ("close" in image) image.close();
    canvas.width = 0;
    canvas.height = 0;
  }

  throw new Error("Fotka je příliš velká i po zmenšení. Zkuste menší soubor.");
}

function uploadBlob(blob: Blob, onProgress: (progress: number) => void) {
  return new Promise<UploadResponse>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/admin/gallery");
    request.setRequestHeader("Content-Type", blob.type || "application/octet-stream");
    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      onProgress(Math.min(95, Math.round((event.loaded / event.total) * 95)));
    });
    request.addEventListener("load", () => {
      let response: UploadResponse = {};
      try {
        response = JSON.parse(request.responseText) as UploadResponse;
      } catch {
        reject(new Error("Server vrátil neplatnou odpověď."));
        return;
      }

      if (request.status >= 200 && request.status < 300) {
        resolve(response);
        return;
      }
      reject(new Error(response.message || "Fotku se nepodařilo uložit."));
    });
    request.addEventListener("error", () => reject(new Error("Připojení k serveru selhalo.")));
    request.addEventListener("abort", () => reject(new Error("Nahrávání bylo přerušeno.")));
    request.send(blob);
  });
}

function statusLabel(item: GalleryUploadItem) {
  switch (item.status) {
    case "waiting":
      return item.message || "Čeká na nahrání";
    case "preparing":
      return "Připravuji fotku";
    case "uploading":
      return `Nahrávám ${item.progress}%`;
    case "success":
      return item.message;
    case "error":
      return item.message;
  }
}

export default function GalleryUploader() {
  const [items, setItems] = useState<GalleryUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const uploadInProgress = useRef(false);
  const router = useRouter();

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.currentTarget.files ?? []);
    setItems(
      selectedFiles.map((file, index) => {
        const error = validateSelectedFile(file);
        return {
          key: `${file.name}-${file.size}-${file.lastModified}-${index}-${crypto.randomUUID()}`,
          file,
          status: error ? "error" : "waiting",
          progress: 0,
          message: error ?? "",
        };
      }),
    );
    event.currentTarget.value = "";
  }

  function updateItem(key: string, update: Partial<GalleryUploadItem>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...update } : item)));
  }

  async function uploadSelectedFiles() {
    if (uploadInProgress.current) return;
    const pendingItems = items.filter((item) => item.status === "waiting");
    if (pendingItems.length === 0) return;

    uploadInProgress.current = true;
    setIsUploading(true);

    try {
      for (const item of pendingItems) {
        updateItem(item.key, { status: "preparing", progress: 0, message: "" });

        try {
          const mimeType = getSupportedMimeType(item.file);
          if (!mimeType) {
            throw new Error("Nepodporovaný typ. Vyberte fotku JPEG, PNG, WebP, HEIC nebo HEIF.");
          }
          const source = mimeType === HEIC_INPUT_MIME_TYPE
            ? await convertHeicToJpeg(item.file)
            : item.file;
          const resizedMimeType = mimeType === HEIC_INPUT_MIME_TYPE ? "image/jpeg" : "image/webp";
          const blob = await prepareImage(source, resizedMimeType);
          updateItem(item.key, { status: "uploading", progress: 0 });

          const uploadMimeType = mimeType === HEIC_INPUT_MIME_TYPE ? "image/jpeg" : mimeType;
          const uploadFile = blob.type ? blob : new Blob([blob], { type: uploadMimeType });
          const response = await uploadBlob(uploadFile, (progress) => {
            updateItem(item.key, { progress });
          });
          updateItem(item.key, {
            status: "success",
            progress: 100,
            message: response.message || "Fotka je uložená.",
          });
        } catch (error) {
          updateItem(item.key, {
            status: "error",
            message: error instanceof Error ? error.message : "Fotku se nepodařilo uložit.",
          });
        }
      }
    } finally {
      uploadInProgress.current = false;
      setIsUploading(false);
      router.refresh();
    }
  }

  return (
    <section
      aria-label="Správa fotogalerie"
      className="mx-auto max-w-3xl rounded-lg border border-stone-700 bg-stone-900/80 p-4 text-left text-white shadow-xl sm:p-6"
    >
      <div className="mb-5">
        <h2 className="text-xl font-semibold">Fotogalerie</h2>
        <p className="mt-1 text-sm text-stone-400">
          Vyberte více fotek JPEG, PNG, WebP, HEIC nebo HEIF. HEIC/HEIF ukládám vždy jako JPEG.
          Ostatní fotky nad 3,5 MB nebo přes 2800 px zmenším a převedu do WebP.
        </p>
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <label className="inline-flex cursor-pointer rounded-md border border-stone-600 px-4 py-2 text-sm font-medium hover:bg-stone-800 focus-within:ring-2 focus-within:ring-red-500">
          <span>{isUploading ? "Nahrávám…" : "Přidat fotky"}</span>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif"
            multiple
            disabled={isUploading}
            onChange={handleFileSelection}
            className="sr-only"
            aria-label="Vybrat fotky do galerie"
          />
        </label>
        <button
          type="button"
          onClick={uploadSelectedFiles}
          disabled={isUploading || items.every((item) => item.status !== "waiting")}
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          {isUploading ? "Nahrávám dávku…" : "Nahrát vybrané fotky"}
        </button>
      </div>

      {items.length > 0 && (
        <ul className="mt-5 divide-y divide-stone-700 rounded-md border border-stone-700">
          {items.map((item) => (
            <li key={item.key} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium" title={item.file.name}>{item.file.name}</p>
                <p
                  role="status"
                  className={`mt-1 text-xs ${item.status === "error" ? "text-red-300" : item.status === "success" ? "text-green-300" : "text-stone-400"}`}
                >
                  {statusLabel(item)}
                </p>
              </div>
              {item.status === "uploading" && (
                <progress
                  className="h-2 w-full accent-red-600 sm:w-32"
                  max={100}
                  value={item.progress}
                  aria-label={`Nahrávání souboru ${item.file.name}`}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
