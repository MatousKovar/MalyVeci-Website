export function getAdminErrorMessage(error, isConfigured) {
  if (error !== "config" && error !== "invalid") return undefined;
  if (!isConfigured) return "Přihlášení správce není nakonfigurované.";
  if (error === "invalid") return "Heslo není správné.";

  return undefined;
}
