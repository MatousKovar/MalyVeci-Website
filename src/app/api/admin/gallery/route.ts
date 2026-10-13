import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  addManagedGalleryPhoto,
  deleteManagedGalleryPhoto,
  GalleryPhotoNotFoundError,
  GalleryUploadValidationError,
} from "@/lib/admin/gallery-storage";
import { MAX_GALLERY_UPLOAD_BYTES } from "@/lib/gallery-upload";
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
    return NextResponse.json({ message: "Mazání fotek je dostupné jen na produkčním webu." }, { status: 403 });
  }
  let id: unknown;
  try {
    const body: unknown = await request.json();
    id = typeof body === "object" && body !== null && "id" in body ? body.id : undefined;
  } catch {
    return NextResponse.json({ message: "Požadavek na smazání fotky není platný." }, { status: 400 });
  }
  if (typeof id !== "string" || !id.trim()) {
    return NextResponse.json({ message: "Vyberte fotku ke smazání." }, { status: 400 });
  }
  try {
    const result = await deleteManagedGalleryPhoto(id);
    revalidatePath("/");
    revalidatePath("/admin");
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof GalleryPhotoNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Failed to delete gallery photo:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ message: "Fotku se nepodařilo smazat. Zkuste to znovu." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) {
      return NextResponse.json({ message: "Přihlášení správce vypršelo." }, { status: 401 });
    }
    throw error;
  }

  if (process.env.VERCEL === "1" && process.env.VERCEL_ENV !== "production") {
    return NextResponse.json(
      { message: "Nahrávání fotek je dostupné jen na produkčním webu." },
      { status: 403 },
    );
  }

  const declaredSize = Number(request.headers.get("content-length"));
  if (declaredSize > MAX_GALLERY_UPLOAD_BYTES) {
    return NextResponse.json(
      { message: "Fotka je příliš velká. Zkuste menší soubor." },
      { status: 413 },
    );
  }

  let bytes: Buffer;
  try {
    bytes = Buffer.from(await request.arrayBuffer());
  } catch {
    return NextResponse.json({ message: "Soubor se nepodařilo přečíst." }, { status: 400 });
  }

  if (bytes.length === 0) {
    return NextResponse.json({ message: "Vybraný soubor je prázdný." }, { status: 400 });
  }
  if (bytes.length > MAX_GALLERY_UPLOAD_BYTES) {
    return NextResponse.json(
      { message: "Fotka je příliš velká. Zkuste menší soubor." },
      { status: 413 },
    );
  }

  try {
    const result = await addManagedGalleryPhoto(bytes, request.headers.get("content-type"));
    revalidatePath("/");
    revalidatePath("/admin");
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof GalleryUploadValidationError) {
      return NextResponse.json({ message: error.message }, { status: 415 });
    }

    console.error(
      "Failed to add gallery photo:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { message: "Fotku se nepodařilo uložit. Zkuste ji nahrát znovu." },
      { status: 500 },
    );
  }
}
