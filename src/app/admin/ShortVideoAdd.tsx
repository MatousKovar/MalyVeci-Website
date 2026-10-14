"use client";

import { useRef, useState, type FormEvent } from "react";
import type { ShortContent } from "@/lib/content-types";

type ShortVideoAddProps = {
  onAdded: (video: ShortContent, message: string, pendingDeployment: boolean) => void;
};

export default function ShortVideoAdd({ onAdded }: ShortVideoAddProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);

  async function addVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setIsPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/shorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: value }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Video se nepodařilo přidat.");
      onAdded(result.video, result.message, result.pendingDeployment);
      setValue("");
      setIsOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Video se nepodařilo přidat. Zkuste to znovu.");
    } finally {
      submitting.current = false;
      setIsPending(false);
    }
  }

  return (
    <div className="mb-6 w-full max-w-xl px-5">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-md bg-red-700 px-4 py-2 hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
        >
          Přidat video
        </button>
      ) : (
        <form onSubmit={addVideo} className="rounded-lg border border-stone-700 bg-stone-950 p-4 text-left">
          <label htmlFor="short-video-input" className="block text-sm font-medium">YouTube odkaz nebo ID videa</label>
          <p id="short-video-help" className="mt-1 text-sm text-stone-400">
            Vložte odkaz z youtube.com, youtu.be nebo samotné 11znakové ID. Video přidáme na konec seznamu.
          </p>
          <input
            id="short-video-input"
            type="text"
            required
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={isPending}
            aria-describedby={`short-video-help${error ? " short-video-error" : ""}`}
            aria-invalid={Boolean(error)}
            className="mt-3 w-full rounded-md border border-stone-600 bg-stone-900 px-3 py-2 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
          />
          {error && <p id="short-video-error" role="alert" className="mt-3 text-sm text-red-200">{error}</p>}
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => { setIsOpen(false); setError(""); }}
              className="rounded-md border border-stone-600 px-4 py-2 hover:bg-stone-800 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-red-700 px-4 py-2 hover:bg-red-600 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
            >
              {isPending ? "Ukládám…" : "Přidat video"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
