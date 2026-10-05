"use server";

import { redirect } from "next/navigation";
import {
  clearAdminSession,
  createAdminSession,
  hasAdminConfiguration,
} from "@/lib/admin/session";
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
