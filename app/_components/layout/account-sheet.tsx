// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { User } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth.provider";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { useI18n } from "@/providers/i18n.provider";

// Login/register entry point (shown only when logged out — see AccountNav).
export function AccountSheet() {
  const router = useRouter();
  const params = useParams();
  const { setLoggedIn } = useAuth();
  const { t } = useI18n();
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

  const title = view === "register" ? t("auth.create_account") : t("auth.sign_in");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("header.sign_in")}
          className="relative cursor-pointer text-foreground"
        >
          <User />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {view === "register" ? t("auth.create_account_intro") : t("auth.sign_in_intro")}
          </SheetDescription>
        </SheetHeader>
        {view === "register" ? (
          <RegisterForm
            onSwitchToLogin={() => setView("login")}
            onRegistered={() => {
              setNotice(t("auth.registered"));
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
