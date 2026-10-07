import HomePage from "@/app/HomePage";
import AdminToolbar from "@/app/admin/AdminToolbar";
import { getTodayInPrague } from "@/lib/admin/event-update.mjs";
import { isAdminAuthenticated } from "@/lib/admin/session";
import { readEventContent } from "@/lib/event-content.mjs";

export const revalidate = 60;

export default async function Home() {
  const isAdmin = await isAdminAuthenticated();
  const { events, errors: eventErrors } = readEventContent();

  return (
    <>
      <HomePage
        events={events}
        eventErrors={eventErrors}
        isAdmin={isAdmin}
        today={getTodayInPrague()}
      />
      {isAdmin && <AdminToolbar />}
    </>
  );
}
