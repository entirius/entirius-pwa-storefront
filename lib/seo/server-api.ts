import { cache } from "react";
import { create_api } from "@/API/api.context";
import { make_server_access } from "@/API/access/api.server-access";

// A single server API instance per request. Sharing this reference between
// generateMetadata and the page body lets the React-cache()d loaders
// (load_product / load_catalog / load_category) dedupe to one network call —
// cache() keys on argument identity, so the api instance must be the same.
export const get_server_api = cache(async () => {
  return create_api(await make_server_access());
});
