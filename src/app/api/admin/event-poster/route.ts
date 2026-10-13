import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { changeEventPoster, MAX_POSTER_UPLOAD_BYTES, PosterValidationError } from "@/lib/admin/event-poster-storage.mjs";
import { AdminUnauthorizedError, requireAdminSession } from "@/lib/admin/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdminSession();
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) return NextResponse.json({ message: "Přihlášení správce vypršelo." }, { status: 401 });
    throw error;
  }
  if (process.env.VERCEL === "1" && process.env.VERCEL_ENV !== "production") {
    return NextResponse.json({ message: "Plakáty lze měnit jen na produkčním webu." }, { status: 403 });
  }
  const length = request.headers.get("content-length");
  if (length && Number(length) > MAX_POSTER_UPLOAD_BYTES + 64_000) {
    return NextResponse.json({ message: "Plakát musí mít nejvýše 3,5 MB." }, { status: 413 });
  }
  let form: FormData;
  try { form = await request.formData(); } catch {
    return NextResponse.json({ message: "Požadavek není platný." }, { status: 400 });
  }
  const id = form.get("id");
  const operation = form.get("operation");
  const file = form.get("poster");
  if (typeof id !== "string" || !id.trim() || !["replace", "remove"].includes(String(operation))) {
    return NextResponse.json({ message: "Vyberte akci a změnu plakátu." }, { status: 400 });
  }
  if (operation === "replace" && (!(file instanceof File) || !file.size || file.size > MAX_POSTER_UPLOAD_BYTES)) {
    return NextResponse.json({ message: "Vyberte plakát do 3,5 MB." }, { status: 400 });
  }
  try {
    const event = await changeEventPoster(id, operation === "remove" ? null : Buffer.from(await (file as File).arrayBuffer()), operation === "remove" ? null : (file as File).type);
    revalidatePath("/");
    revalidatePath("/admin");
    return NextResponse.json({ event, message: process.env.VERCEL === "1" ? "Plakát je uložený. Na webu se změna projeví po dokončení nasazení." : "Změna plakátu je uložená." });
  } catch (error) {
    if (error instanceof PosterValidationError) return NextResponse.json({ message: error.message }, { status: 400 });
    console.error("Failed to change event poster:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ message: "Plakát se nepodařilo změnit. Zkuste to znovu." }, { status: 500 });
  }
}
