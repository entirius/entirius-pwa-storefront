// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Component, Suspense, useRef, useState, useTransition, type ReactNode } from "react";
import dynamic from "next/dynamic";
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
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/providers/auth.provider";
import { HEADER_ICON } from "./header-icon";
import { useI18n } from "@/providers/i18n.provider";

// Each form (react-hook-form, zod) loads the first time it is shown, not with every page. The <Suspense> around them
// keeps that load inside the sheet: without it the page-level boundary takes over and hides the page. A switch away
// from the login form runs in a transition: the login form stays visible but disabled until the next one has loaded,
// so nothing typed in the meantime lands in it. The way back needs none: the login form is always loaded first.
const loadLoginForm = () => import("./login-form").then((m) => m.LoginForm);
const LoginForm = dynamic(loadLoginForm);
const RegisterForm = dynamic(() => import("./register-form").then((m) => m.RegisterForm));
const ForgotPasswordForm = dynamic(() => import("./forgot-password-form").then((m) => m.ForgotPasswordForm));

// The login form is requested when the trigger is about to be used (pointer over it, focus, touch), so it is usually
// there when the sheet opens. Nothing loads before that. A lazy component that has not rendered yet suspends once
// even with its module cached, and React holds the fallback for about 300 ms. So a preloaded form is rendered
// directly. It is chosen when the sheet opens, so the form is not remounted while the sheet is open. A failed preload
// is not reported: opening the sheet requests the form again and the boundary below shows the failure.
let loadedLoginForm: Awaited<ReturnType<typeof loadLoginForm>> | undefined;

const preloadLoginForm = () => {
  loadLoginForm()
    .then((form) => {
      loadedLoginForm = form;
    })
    .catch(() => {});
};

// A form that fails to load (weak network, a tab older than the last deploy) or to render shows the fallback inside
// the sheet instead of taking down the page. A failed lazy import stays failed for the page's lifetime (React caches
// the rejection), so remounting would fail again: the retry button reloads the page.
class FormLoadBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
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
  const [switching, startTransition] = useTransition();
  const contentRef = useRef<HTMLDivElement>(null);
  const [LoginView, setLoginView] = useState(() => LoginForm);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    // Reset to the login view when the sheet opens. Not on close: the content stays mounted for the exit animation,
    // and the login form would mount again in the closing sheet.
    if (next) {
      setLoginView(() => loadedLoginForm ?? LoginForm);
      setView("login");
      setNotice(null);
    }
  };

  // The clicked button is disabled until the next form has loaded, so focus moves to the sheet (tabIndex -1) and
  // stays inside the dialog meanwhile.
  const switchTo = (next: "register" | "forgot") => {
    contentRef.current?.focus();
    startTransition(() => {
      setNotice(null);
      setView(next);
    });
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("header.sign_in")}
          className="relative cursor-pointer text-foreground"
          onPointerEnter={preloadLoginForm}
          onFocus={preloadLoginForm}
          onTouchStart={preloadLoginForm}
        >
          <User className={HEADER_ICON} />
        </Button>
      </SheetTrigger>
      <SheetContent ref={contentRef} side="right">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{intro}</SheetDescription>
        </SheetHeader>
        <FormLoadBoundary
          fallback={
            <div role="alert" className="flex flex-col items-center gap-3 p-4 text-center text-sm">
              <p>{t("common.try_again")}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                {t("common.retry")}
              </Button>
            </div>
          }
        >
          <Suspense fallback={<Spinner className="m-auto size-8 text-muted-foreground" />}>
            {view === "forgot" ? (
              <ForgotPasswordForm
                onBack={() => setView("login")}
                onSent={() => {
                  setNotice(t("auth.reset_sent"));
                  setView("login");
                }}
              />
            ) : view === "register" ? (
              <RegisterForm
                onSwitchToLogin={() => setView("login")}
                onRegistered={() => {
                  setNotice(t("auth.registered"));
                  setView("login");
                }}
              />
            ) : (
              <fieldset disabled={switching} aria-busy={switching}>
                <LoginView
                  notice={notice}
                  onSuccess={() => {
                    setLoggedIn(true);
                    setOpen(false);
                    goToProfile();
                  }}
                  onSwitchToRegister={() => switchTo("register")}
                  onForgotPassword={() => switchTo("forgot")}
                />
              </fieldset>
            )}
          </Suspense>
        </FormLoadBoundary>
      </SheetContent>
    </Sheet>
  );
}
