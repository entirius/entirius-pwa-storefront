"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth.provider";

// Auth guard for the whole /profile section. Auth state is seeded server-side
// (AuthProvider), so a logged-in hard load passes without a flash; a logged-out
// visitor (or a logout) is bounced home.
export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) router.replace("/");
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  return <div className="mx-auto w-full max-w-2xl">{children}</div>;
}
