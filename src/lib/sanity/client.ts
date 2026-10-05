import "server-only";
import { createClient } from "@sanity/client";

const apiVersion = "2026-10-05";

export function getSanityClient() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

  if (!projectId || !dataset) {
    throw new Error("Sanity project ID and dataset must be configured.");
  }

  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: true,
    perspective: "published",
  });
}
