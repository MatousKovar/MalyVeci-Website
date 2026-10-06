import HomePage from "@/app/HomePage";
import AdminToolbar from "@/app/admin/AdminToolbar";
import type { ManagedEvent } from "@/lib/events";
import { isAdminAuthenticated } from "@/lib/admin/session";
import { fetchEvents } from "@/lib/sanity/events";

export const revalidate = 60;

export default async function Home() {
  const isAdmin = await isAdminAuthenticated();
  let events: ManagedEvent[] = [];
  let eventsError = false;

  try {
    events = await fetchEvents();
  } catch (error) {
    eventsError = true;
    console.error(
      "Failed to load events from Sanity:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  return (
    <>
      <HomePage events={events} eventsError={eventsError} isAdmin={isAdmin} />
      {isAdmin && <AdminToolbar />}
    </>
  );
}
