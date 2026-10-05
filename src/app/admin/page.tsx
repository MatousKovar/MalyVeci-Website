import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/session";
import { login } from "./actions";

type AdminPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  if (await isAdminAuthenticated()) redirect("/");

  const { error } = await searchParams;
  const message =
    error === "invalid"
      ? "Heslo není správné."
      : error === "config"
        ? "Přihlášení správce není nakonfigurované."
        : undefined;

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
          maxLength={1024}
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
