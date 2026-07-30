"use client";

import { User } from "lucide-react";

import { useAuth } from "@/providers/auth.provider";
import { LinkDynamic } from "@/lib/link-dynamic";
import { Button } from "@/components/ui/button";
import { AccountSheet } from "./account-sheet";

// Logged in → the User icon links to the /profile hub. Logged out → it opens the
// login/register Sheet. Auth state comes from the shared AuthProvider context.
export function AccountNav() {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn) {
    return (
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="relative cursor-pointer text-foreground"
      >
        <LinkDynamic href="/profile" aria-label="Account">
          <User />
        </LinkDynamic>
      </Button>
    );
  }

  return <AccountSheet />;
}
