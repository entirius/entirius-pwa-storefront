// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

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
