import { timingSafeEqual } from "node:crypto";
import { cleanupPastEvents } from "@/lib/admin/event-cleanup.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || authorization.length !== expected.length || !timingSafeEqual(authorization, expected)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.VERCEL === "1" && process.env.VERCEL_ENV !== "production") {
    return Response.json({ error: "Cleanup is unavailable in preview deployments." }, { status: 403 });
  }
  try {
    const result = await cleanupPastEvents();
    console.info("event-cleanup", result);
    return Response.json(result);
  } catch {
    console.error("event-cleanup", { removedEvents: 0, removedPosters: 0, errors: 1, error: "Cleanup failed; inspect storage configuration and retry." });
    return Response.json({ error: "Cleanup failed." }, { status: 500 });
  }
}
