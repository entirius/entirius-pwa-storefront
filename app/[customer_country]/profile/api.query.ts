import { client_get_profile } from "@/lib/auth-client";

// client_get_profile builds its own client-access api internally.
export const profile_query = () => ({
  queryKey: ["profile"] as const,
  queryFn: async () => {
    const res = await client_get_profile();
    return res.ok ? res.profile : null;
  },
});
