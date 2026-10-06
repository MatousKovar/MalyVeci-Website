"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  updateManagedEvent,
  type EventUpdateState,
} from "@/lib/admin/event-update.mjs";
import {
  AdminUnauthorizedError,
  clearAdminSession,
  createAdminSession,
  hasAdminConfiguration,
  requireAdminSession,
} from "@/lib/admin/session";
import {
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
  redirect("/");
}

export async function logout() {
  await clearAdminSession();
  redirect("/");
}

export async function updateEvent(
  _previousState: EventUpdateState,
  formData: FormData,
): Promise<EventUpdateState> {
  try {
    const result = await updateManagedEvent(formData, {
      isAuthorized: async () => {
        try {
          await requireAdminSession();
          return true;
        } catch (error) {
          if (error instanceof AdminUnauthorizedError) return false;
          throw error;
        }
      },
      findEventById: findSanityEventById,
      findOtherEventOnDate: findOtherSanityEventOnDate,
      updateEvent: updateSanityEvent,
    });

    if (result.status === "error") return result;

    revalidatePath("/");
    return {
      ...result,
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
