import "server-only";
import { createClient } from "@sanity/client";
import sanityConfig from "@/lib/sanity/api-version.json";

export function getSanityClient() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

  if (!projectId || !dataset) {
    throw new Error("Sanity project ID and dataset must be configured.");
  }

  return createClient({
    projectId,
    dataset,
    apiVersion: sanityConfig.apiVersion,
    useCdn: true,
    perspective: "published",
  });
}

export function getSanityWriteClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) {
    throw new Error("SANITY_API_WRITE_TOKEN must be configured to edit events.");
  }

  return getSanityClient().withConfig({ token, useCdn: false });
}
