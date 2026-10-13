"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ManagedEvent } from "@/lib/events";

const maxBytes = 3_500_000;

export default function EventPosterEditor({ event }: { event: ManagedEvent }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [posterPath, setPosterPath] = useState(event.posterPath);
  const [file, setFile] = useState<File | null>(null);
  const [savedPreview, setSavedPreview] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const previewFile = file || savedPreview;
    if (!previewFile) { setPreview(""); return; }
    const url = URL.createObjectURL(previewFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, savedPreview]);

  async function savePoster(operation: "replace" | "remove") {
    if (pending) return;
    setPending(true);
    setError("");
    setMessage("");
    const form = new FormData();
    form.set("id", event.id);
    form.set("operation", operation);
    if (operation === "replace" && file) form.set("poster", file);
    try {
      const response = await fetch("/api/admin/event-poster", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Plakát se nepodařilo změnit.");
      setPosterPath(result.event.posterPath);
      setSavedPreview(operation === "replace" ? file : null);
      setFile(null);
      if (input.current) input.current.value = "";
      setMessage(result.message);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Plakát se nepodařilo změnit.");
    } finally { setPending(false); }
  }

  function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (file) void savePoster("replace");
  }

  return (
    <form onSubmit={submit} className="mt-5 grid gap-3 border-t border-stone-700 pt-4">
      <label className="grid gap-2 text-sm text-stone-300">
        Plakát akce
        <span>JPEG, PNG nebo WebP, nejvýše 3,5 MB. Obrázek se neořezává.</span>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={pending}
          onChange={(change) => {
            const selected = change.target.files?.[0] ?? null;
            setMessage("");
            setError("");
            if (selected && (selected.size > maxBytes || !["image/jpeg", "image/png", "image/webp"].includes(selected.type))) {
              setFile(null);
              change.target.value = "";
              setError("Vyberte obrázek JPEG, PNG nebo WebP do 3,5 MB.");
              return;
            }
            setFile(selected);
          }}
          className="rounded-md border border-stone-700 p-2"
        />
      </label>
      {(preview || posterPath) && (
        // Blob URLs and newly uploaded paths must render before the next deployment.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview || posterPath} alt={preview ? "Náhled nového plakátu" : `Plakát akce ${event.title}`} className="max-h-80 max-w-full rounded-md object-contain" />
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending || !file} className="rounded-md bg-red-700 px-4 py-2 text-sm disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400">
          {pending ? "Ukládám…" : "Uložit plakát"}
        </button>
        {file && <button type="button" disabled={pending} onClick={() => { setFile(null); if (input.current) input.current.value = ""; }} className="rounded-md border border-stone-700 px-4 py-2 text-sm disabled:opacity-50">Zrušit výběr</button>}
        {posterPath && <button type="button" disabled={pending} onClick={() => void savePoster("remove")} className="rounded-md border border-red-700 px-4 py-2 text-sm text-red-200 disabled:opacity-50">Odebrat plakát</button>}
      </div>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {message && <p role="status" className="text-sm text-green-300">{message}</p>}
    </form>
  );
}
