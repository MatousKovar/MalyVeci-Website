export function getAdminErrorMessage(error, isConfigured) {
  if (error !== "config" && error !== "invalid") return undefined;
  if (!isConfigured) return "Správa není správně nakonfigurovaná. Zkontrolujte její přihlašovací údaje a úložiště.";
  if (error === "invalid") return "Heslo není správné.";

  return undefined;
}
