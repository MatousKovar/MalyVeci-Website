import { logout } from "./actions";

export default function AdminToolbar() {
  return (
    <aside
      aria-label="Ovládání správce"
      className="fixed bottom-4 right-4 z-[60] flex items-center gap-3 rounded-lg border border-red-700/70 bg-stone-950/95 px-3 py-2 text-sm text-stone-100 shadow-lg backdrop-blur"
    >
      <span>Přihlášený správce</span>
      <form action={logout}>
        <button
          type="submit"
          className="rounded-md bg-stone-800 px-3 py-1.5 font-medium hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Odhlásit
        </button>
      </form>
    </aside>
  );
}
