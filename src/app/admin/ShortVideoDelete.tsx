"use client";

import { handleThumbError, ytThumb } from "@/../components/ui/youtube";
import { useEffect, useRef, useState } from "react";
import type { ShortContent } from "@/lib/content-types";

type ShortVideoDeleteProps = {
  video: ShortContent;
  onDeleted: (id: string, message: string) => void;
  onClose: () => void;
};

export default function ShortVideoDelete({ video, onDeleted, onClose }: ShortVideoDeleteProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  async function deleteVideo() {
    if (isPending) return;
    setIsPending(true);
    setError("");

    try {
      const response = await fetch("/api/admin/shorts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: video.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Video se nepodařilo smazat.");
      onDeleted(video.id, result.message);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Video se nepodařilo smazat. Zkuste to znovu.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="delete-short-video-title"
      aria-describedby="delete-short-video-description"
      onCancel={(event) => {
        if (isPending) event.preventDefault();
      }}
      onClose={onClose}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-stone-700 bg-stone-950 p-5 text-left text-white backdrop:bg-black/80"
    >
      <h3 id="delete-short-video-title" className="text-xl font-semibold">Smazat krátké video?</h3>
      <p id="delete-short-video-description" className="mt-2 text-sm text-stone-300">
        Toto krátké video bude odebrané z webu. Na YouTube zůstane dostupné.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ytThumb(video.videoId)}
        alt="Krátké video vybrané ke smazání"
        onError={(event) => handleThumbError(event, video.videoId)}
        className="mt-4 max-h-[45dvh] w-full rounded-md object-contain"
      />
      <a
        href={`https://www.youtube.com/shorts/${video.videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block break-all text-sm text-red-200 underline"
      >
        {`https://www.youtube.com/shorts/${video.videoId}`}
      </a>
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
          onClick={deleteVideo}
          className="rounded-md bg-red-700 px-4 py-2 hover:bg-red-600 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
        >
          {isPending ? "Mažu…" : "Smazat video"}
        </button>
      </div>
    </dialog>
  );
}
