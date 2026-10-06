"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createManagedEvent,
  deleteManagedEvent,
  updateManagedEvent,
  type EventEditorActionState,
} from "@/lib/admin/event-update.mjs";
import {
  AdminUnauthorizedError,
  clearAdminSession,
  createAdminSession,
  hasAdminConfiguration,
  requireAdminSession,
} from "@/lib/admin/session";
import {
  createSanityEvent,
  deleteSanityEvent,
  findOtherSanityEventOnDate,
  findSanityEventById,
  updateSanityEvent,
} from "@/lib/sanity/events";
import { verifyPassword } from "@/lib/admin/session-crypto.mjs";

export async function login(formData: FormData) {
  if (!hasAdminConfiguration()) redirect("/admin?error=config");

  const password = formData.get("password");
  if (
    typeof password !== "string" ||
    !(await verifyPassword(password, process.env.ADMIN_PASSWORD_HASH!))
  ) {
    redirect("/admin?error=invalid");
  }

  await createAdminSession();
  redirect("/admin");
}

export async function logout() {
  await clearAdminSession();
  redirect("/");
}

async function isAdminActionAuthorized() {
  try {
    await requireAdminSession();
    return true;
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) return false;
    throw error;
  }
}

export async function updateEvent(
  _previousState: EventEditorActionState,
  formData: FormData,
): Promise<EventEditorActionState> {
  try {
    const result = await updateManagedEvent(formData, {
      isAuthorized: isAdminActionAuthorized,
      findEventById: findSanityEventById,
      findOtherEventOnDate: findOtherSanityEventOnDate,
      updateEvent: updateSanityEvent,
    });

    if (result.status === "error") return result;

    revalidatePath("/");
    revalidatePath("/admin");
    return {
      status: "success",
      event: result.event,
      message: "Změny akce jsou uložené.",
    };
  } catch (error) {
    console.error(
      "Failed to update event in Sanity:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return {
      status: "error",
      message: "Akci se nepodařilo uložit. Zkuste to prosím znovu.",
    };
  }
}

export async function createEvent(
  _previousState: EventEditorActionState,
  formData: FormData,
): Promise<EventEditorActionState> {
  try {
    const result = await createManagedEvent(formData, {
      isAuthorized: isAdminActionAuthorized,
      findOtherEventOnDate: findOtherSanityEventOnDate,
      createEvent: createSanityEvent,
    });

    if (result.status === "error") return result;

    revalidatePath("/");
    revalidatePath("/admin");
    return {
      status: "success",
      id: result.event.id,
      event: result.event,
      message: "Akce byla přidána.",
    };
  } catch (error) {
    console.error(
      "Failed to create Sanity event:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return {
      status: "error",
      message: "Akci se nepodařilo přidat. Zkuste to prosím znovu.",
    };
  }
}

export async function deleteEvent(
  _previousState: EventEditorActionState,
  formData: FormData,
): Promise<EventEditorActionState> {
  try {
    const result = await deleteManagedEvent(formData, {
      isAuthorized: isAdminActionAuthorized,
      findEventById: findSanityEventById,
      deleteEvent: deleteSanityEvent,
    });

    if (result.status === "error") return result;

    revalidatePath("/");
    revalidatePath("/admin");
    return {
      status: "success",
      id: result.id,
      message: "Akce byla odebrána.",
    };
  } catch (error) {
    console.error(
      "Failed to delete Sanity event:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return {
      status: "error",
      message: "Akci se nepodařilo odebrat. Zkuste to prosím znovu.",
    };
  }
}
