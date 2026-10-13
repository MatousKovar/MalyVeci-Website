"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { GalleryPhotoContent } from "@/lib/content-types";

type GalleryPhotoDeleteProps = {
  photo: GalleryPhotoContent;
  onDeleted: (id: string, message: string) => void;
  onClose: () => void;
};

export default function GalleryPhotoDelete({ photo, onDeleted, onClose }: GalleryPhotoDeleteProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  async function deletePhoto() {
    if (isPending) return;
    setIsPending(true);
    setError("");

    try {
      const response = await fetch("/api/admin/gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: photo.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Fotku se nepodařilo smazat.");
      onDeleted(photo.id, result.message);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Fotku se nepodařilo smazat. Zkuste to znovu.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="delete-gallery-title"
      aria-describedby="delete-gallery-description"
      onCancel={(event) => {
        if (isPending) event.preventDefault();
      }}
      onClose={onClose}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-stone-700 bg-stone-950 p-5 text-left text-white backdrop:bg-black/80"
    >
      <h3 id="delete-gallery-title" className="text-xl font-semibold">Smazat fotku?</h3>
      <p id="delete-gallery-description" className="mt-2 text-sm text-stone-300">
        Tato fotka bude odebraná z galerie. Smazání nelze vrátit v rozhraní webu.
      </p>
      <Image
        src={photo.src}
        alt="Fotka vybraná ke smazání"
        width={photo.width}
        height={photo.height}
        sizes="(max-width: 640px) 90vw, 480px"
        className="mt-4 max-h-[45dvh] w-full rounded-md object-contain"
      />
      {error && <p role="alert" className="mt-4 text-sm text-red-200">{error}</p>}
      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          autoFocus
          disabled={isPending}
          onClick={onClose}
          className="rounded-md border border-stone-600 px-4 py-2 hover:bg-stone-800 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
        >
          Zrušit
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={deletePhoto}
          className="rounded-md bg-red-700 px-4 py-2 hover:bg-red-600 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
        >
          {isPending ? "Mažu…" : "Smazat fotku"}
        </button>
      </div>
    </dialog>
  );
}
