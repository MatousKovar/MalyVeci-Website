import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { deleteManagedShortVideo, ShortVideoNotFoundError } from "@/lib/admin/short-storage";
import {
  AdminUnauthorizedError,
  requireAdminSession,
} from "@/lib/admin/session";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  try {
    await requireAdminSession();
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return NextResponse.json({ message: "Přihlášení správce vypršelo." }, { status: 401 });
    }
    throw error;
  }
  if (process.env.VERCEL === "1" && process.env.VERCEL_ENV !== "production") {
    return NextResponse.json({ message: "Mazání krátkých videí je dostupné jen na produkčním webu." }, { status: 403 });
  }
  let id: unknown;
  try {
    const body: unknown = await request.json();
    id = typeof body === "object" && body !== null && "id" in body ? body.id : undefined;
  } catch {
    return NextResponse.json({ message: "Požadavek na smazání krátkého videa není platný." }, { status: 400 });
  }
  if (typeof id !== "string" || !id.trim()) {
    return NextResponse.json({ message: "Vyberte krátké video ke smazání." }, { status: 400 });
  }
  try {
    const result = await deleteManagedShortVideo(id);
    revalidatePath("/");
    revalidatePath("/admin");
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ShortVideoNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Failed to delete short video:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ message: "Krátké video se nepodařilo smazat. Zkuste to znovu." }, { status: 500 });
  }
}
