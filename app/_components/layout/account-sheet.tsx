// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useState, type ReactNode } from "react";
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
import { HEADER_ICON } from "./header-icon";
import { useI18n } from "@/providers/i18n.provider";

// The forms (react-hook-form, zod) load the first time they are shown, not with every page: a plain import() when
// the view mounts, and the form renders once it is there (a few ms from the cache). No <Suspense> on purpose: React
// holds a suspended boundary's fallback for at least 300 ms, even when the file is already loaded.
const loadLoginForm = () => import("./login-form").then((m) => m.LoginForm);
const loadRegisterForm = () => import("./register-form").then((m) => m.RegisterForm);
const loadForgotPasswordForm = () => import("./forgot-password-form").then((m) => m.ForgotPasswordForm);

// Renders `children` with what `load` resolves to. A load that fails (no network, a tab older than the last deploy)
// offers a page reload: the bundler keeps a failed chunk failed for the page's lifetime.
function Loaded<T>({ load, children }: { load: () => Promise<T>; children: (loaded: T) => ReactNode }) {
  const { t } = useI18n();
  const [state, setState] = useState<{ loaded: T } | "failed" | null>(null);

  useEffect(() => {
    let live = true;
    void load().then(
      (loaded) => live && setState({ loaded }),
      () => live && setState("failed"),
    );
    return () => {
      live = false;
    };
  }, [load]);

  if (state === "failed") {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 p-4 text-center text-sm">
        <p>{t("common.try_again")}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }
  return state ? children(state.loaded) : null;
}

// Login/register entry point (shown only when logged out — see AccountNav).
export function AccountSheet() {
  const router = useRouter();
  const params = useParams();
  const { setLoggedIn } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"login" | "register" | "forgot">("login");
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

  const title =
    view === "register"
      ? t("auth.create_account")
      : view === "forgot"
        ? t("auth.forgot_title")
        : t("auth.sign_in");
  const intro =
    view === "register"
      ? t("auth.create_account_intro")
      : view === "forgot"
        ? t("auth.forgot_intro")
        : t("auth.sign_in_intro");

  // `key={view}`: each view mounts its own <Loaded>, so a switch never renders one form with another's props.
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("header.sign_in")}
          className="relative cursor-pointer text-foreground"
        >
          <User className={HEADER_ICON} />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{intro}</SheetDescription>
        </SheetHeader>
        {view === "forgot" ? (
          <Loaded key={view} load={loadForgotPasswordForm}>
            {(ForgotPasswordForm) => (
              <ForgotPasswordForm
                onBack={() => setView("login")}
                onSent={() => {
                  setNotice(t("auth.reset_sent"));
                  setView("login");
                }}
              />
            )}
          </Loaded>
        ) : view === "register" ? (
          <Loaded key={view} load={loadRegisterForm}>
            {(RegisterForm) => (
              <RegisterForm
                onSwitchToLogin={() => setView("login")}
                onRegistered={() => {
                  setNotice(t("auth.registered"));
                  setView("login");
                }}
              />
            )}
          </Loaded>
        ) : (
          <Loaded key={view} load={loadLoginForm}>
            {(LoginForm) => (
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
                onForgotPassword={() => {
                  setNotice(null);
                  setView("forgot");
                }}
              />
            )}
          </Loaded>
        )}
      </SheetContent>
    </Sheet>
  );
}
