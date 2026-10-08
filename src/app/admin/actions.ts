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
  createManagedEventInStorage,
  deleteManagedEventFromStorage,
  findManagedEventById,
  findOtherManagedEventOnDate,
  updateManagedEventInStorage,
} from "@/lib/admin/event-storage";
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
      findEventById: findManagedEventById,
      findOtherEventOnDate: findOtherManagedEventOnDate,
      updateEvent: updateManagedEventInStorage,
    });

    if (result.status === "error") return result;

    revalidatePath("/");
    revalidatePath("/admin");
    return {
      status: "success",
      event: result.event,
      message:
        process.env.VERCEL === "1"
          ? "Změny jsou uložené. Na webu se projeví po dokončení nasazení."
          : "Změny jsou uložené v JSON souboru.",
    };
  } catch (error) {
    console.error(
      "Failed to update event content:",
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
      findOtherEventOnDate: findOtherManagedEventOnDate,
      createEvent: createManagedEventInStorage,
    });

    if (result.status === "error") return result;

    revalidatePath("/");
    revalidatePath("/admin");
    return {
      status: "success",
      id: result.event.id,
      event: result.event,
      message:
        process.env.VERCEL === "1"
          ? "Akce je uložená. Na webu se projeví po dokončení nasazení."
          : "Akce je uložená v JSON souboru.",
    };
  } catch (error) {
    console.error(
      "Failed to create event content:",
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
      findEventById: findManagedEventById,
      deleteEvent: deleteManagedEventFromStorage,
    });

    if (result.status === "error") return result;

    revalidatePath("/");
    revalidatePath("/admin");
    return {
      status: "success",
      id: result.id,
      message:
        process.env.VERCEL === "1"
          ? "Akce je odebraná. Z webu zmizí po dokončení nasazení."
          : "Akce je odebraná z JSON souboru.",
    };
  } catch (error) {
    console.error(
      "Failed to delete event content:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return {
      status: "error",
      message: "Akci se nepodařilo odebrat. Zkuste to prosím znovu.",
    };
  }
}
