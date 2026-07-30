"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { User } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth.provider";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

// Login/register entry point (shown only when logged out — see AccountNav).
export function AccountSheet() {
  const router = useRouter();
  const params = useParams();
  const { setLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"login" | "register">("login");
  const [notice, setNotice] = useState<string | null>(null);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      // Reset to the login view whenever the sheet closes.
      setView("login");
      setNotice(null);
    }
  };

  // After login: flip auth, close the sheet, and go to the profile hub.
  // Mirror LinkDynamic's country prefixing.
  const goToProfile = () => {
    const country = params?.customer_country as string | undefined;
    const href =
      !country || country === "default" ? "/profile" : `/${country}/profile`;
    router.push(href);
  };

  const title = view === "register" ? "Create account" : "Sign in";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative cursor-pointer text-foreground"
        >
          <User />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {view === "register" ? (
          <RegisterForm
            onSwitchToLogin={() => setView("login")}
            onRegistered={() => {
              setNotice(
                "Account created — check your email to confirm, then sign in.",
              );
              setView("login");
            }}
          />
        ) : (
          <LoginForm
            notice={notice}
            onSuccess={() => {
              setLoggedIn(true);
              setOpen(false);
              goToProfile();
            }}
            onSwitchToRegister={() => {
              setNotice(null);
              setView("register");
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
