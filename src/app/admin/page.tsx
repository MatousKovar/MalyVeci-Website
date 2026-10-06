import Link from "next/link";
import { getAdminErrorMessage } from "@/lib/admin/login-message.mjs";
import {
  hasAdminConfiguration,
  isAdminAuthenticated,
} from "@/lib/admin/session";
import { getTodayInPrague } from "@/lib/admin/event-update.mjs";
import type { ManagedEvent } from "@/lib/events";
import { fetchEvents } from "@/lib/sanity/events";
import AdminToolbar from "./AdminToolbar";
import EventEditor from "./EventEditor";
import { login } from "./actions";

type AdminPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  if (await isAdminAuthenticated()) {
    let events: ManagedEvent[] = [];
    let eventsError = false;

    try {
      events = await fetchEvents();
    } catch (error) {
      eventsError = true;
      console.error(
        "Failed to load events for the admin page:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }

    return (
      <>
        <main className="min-h-screen bg-stone-950 px-5 py-20 text-stone-100">
          <div className="mx-auto mb-8 flex max-w-3xl flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">Správa akcí</h1>
              <p className="mt-2 text-sm text-stone-400">
                Přidávejte, upravujte a odebírejte koncerty.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-md border border-stone-700 px-4 py-2 text-sm hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Zpět na web
            </Link>
          </div>
          {eventsError && (
            <p
              role="alert"
              className="mx-auto mb-5 max-w-3xl rounded-md border border-red-800 bg-red-950/50 p-4 text-sm text-red-200"
            >
              Seznam akcí se nepodařilo načíst. Zkontrolujte připojení k Sanity a
              obnovte stránku.
            </p>
          )}
          <EventEditor events={events} today={getTodayInPrague()} />
        </main>
        <AdminToolbar />
      </>
    );
  }

  const { error } = await searchParams;
  const message = getAdminErrorMessage(error, hasAdminConfiguration());

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 px-5 text-stone-100">
      <form
        action={login}
        className="w-full max-w-sm rounded-xl border border-stone-700 bg-black/50 p-6 shadow-xl"
      >
        <h1 className="mb-6 text-2xl font-semibold">Přihlášení správce</h1>
        <label htmlFor="password" className="mb-2 block text-sm text-stone-300">
          Heslo
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-md border border-stone-600 bg-stone-900 px-3 py-2 text-white outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/30"
        />
        {message && (
          <p role="alert" className="mt-3 text-sm text-red-300">
            {message}
          </p>
        )}
        <button
          type="submit"
          className="mt-5 w-full rounded-md bg-red-700 px-4 py-2 font-medium text-white transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-stone-950"
        >
          Přihlásit se
        </button>
      </form>
    </main>
  );
}
