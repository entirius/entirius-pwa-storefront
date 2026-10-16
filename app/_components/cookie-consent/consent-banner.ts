// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import "./cookie-consent.css";

import * as CookieConsent from "vanilla-cookieconsent";

import { fetch_cookie_banner, post_cookie_consent } from "./consent-api";
import { apply_consent, consent_state } from "./consent-mode";
import type { CONSENT_ACTION, COOKIE_BANNER } from "./consent.d";

// Loaded dynamically, and only once the backend returned a banner (cookie-consent.client.tsx): the
// library and its CSS stay out of the layout bundle. Every text shown comes from the backend banner.

// Set on <html> once a banner runs; app/globals.css shows the preferences links only then.
const READY_ATTRIBUTE = "data-consent-ready";
// Any link whose href ends with this marker reopens the preferences dialog (a CMS-edited footer).
const PREFERENCES_MARKER = "#cookie-consents";

let banner: COOKIE_BANNER | null = null;

export async function start_cookie_consent(next: COOKIE_BANNER) {
  if (banner) CookieConsent.reset(false);
  else document.addEventListener("click", open_preferences_from_link);
  banner = next;
  await CookieConsent.run(build_config(next));
  document.documentElement.setAttribute(READY_ATTRIBUTE, "");
}

function open_preferences_from_link(event: MouseEvent) {
  const link = (event.target as Element | null)?.closest?.("a[href]");
  if (!link?.getAttribute("href")?.endsWith(PREFERENCES_MARKER)) return;
  event.preventDefault();
  CookieConsent.showPreferences();
}

function build_config(b: COOKIE_BANNER): CookieConsent.CookieConsentConfig {
  const is_desktop = window.matchMedia("(min-width: 768px)").matches;
  return {
    revision: b.revision,
    cookie: { expiresAfterDays: b.max_age_days },
    guiOptions: {
      consentModal: is_desktop
        ? { layout: "box", position: "bottom right" }
        : { layout: "bar inline", position: "bottom" },
      preferencesModal: { layout: "box" },
    },
    categories: Object.fromEntries(
      b.categories.map((category) => [
        category.key,
        { enabled: category.required, readOnly: category.required },
      ]),
    ),
    language: {
      default: b.language,
      translations: { [b.language]: translation(b) },
    },
    onModalReady: ({ modal }) => mark_buttons(modal),
    onConsent: ({ cookie }) => apply_decision(cookie.categories),
    onFirstConsent: ({ cookie }) => log_decision(cookie, []),
    onChange: ({ cookie, changedCategories }) => {
      apply_decision(cookie.categories);
      log_decision(cookie, previous_categories(cookie.categories, changedCategories));
    },
  };
}

// The library's buttons carry the data attributes of the storefront's <Button>, so the rules a
// client theme hooks on them (size, label style) reach the banner too.
function mark_buttons(modal: HTMLElement) {
  for (const button of modal.querySelectorAll(".cm__btn, .pm__btn")) {
    const is_secondary = /__btn--secondary/.test(button.className);
    button.setAttribute("data-variant", is_secondary ? "outline" : "default");
    button.setAttribute("data-size", "default");
  }
}

function translation(b: COOKIE_BANNER): CookieConsent.Translation {
  return {
    consentModal: {
      description: b.text,
      acceptAllBtn: b.buttons.accept_all,
      acceptNecessaryBtn: b.buttons.reject_all,
      showPreferencesBtn: b.buttons.customize,
    },
    preferencesModal: {
      title: b.preferences_title ?? b.buttons.customize,
      closeIconLabel: b.close_label ?? undefined,
      acceptAllBtn: b.buttons.accept_all,
      acceptNecessaryBtn: b.buttons.reject_all,
      savePreferencesBtn: b.buttons.save,
      sections: b.categories.map((category) => ({
        title: category.label,
        description: category.description,
        linkedCategory: category.key,
      })),
    },
  };
}

function apply_decision(accepted: string[]) {
  if (banner) apply_consent(consent_state(accepted, banner.categories));
}

// onChange lists the categories that flipped, so the previous set is their symmetric difference.
function previous_categories(accepted: string[], changed: string[]): string[] {
  return [
    ...accepted.filter((key) => !changed.includes(key)),
    ...changed.filter((key) => !accepted.includes(key)),
  ];
}

function consent_action(
  accepted: string[],
  previous: string[],
  b: COOKIE_BANNER,
): CONSENT_ACTION {
  const optional = b.categories.filter((c) => !c.required).map((c) => c.key);
  const granted = optional.filter((key) => accepted.includes(key));
  if (granted.length === optional.length) return "accept_all";
  if (granted.length > 0) return "custom";
  return optional.some((key) => previous.includes(key)) ? "withdraw" : "reject_all";
}

async function log_decision(cookie: CookieConsent.CookieValue, previous: string[]) {
  const b = banner;
  if (!b) return;
  const status = await post_cookie_consent({
    consent_id: cookie.consentId,
    revision: b.revision,
    language: b.language,
    action: consent_action(cookie.categories, previous, b),
    categories: Object.fromEntries(
      b.categories.map((c) => [c.key, c.required || cookie.categories.includes(c.key)]),
    ),
  });

  if (status === 409) return restart_with_fresh_banner();
  if (status !== 201) console.warn(`[consent] decision not logged (HTTP ${status})`);
}

// A newer banner was published: fetch it past every cache and ask again.
async function restart_with_fresh_banner() {
  const next = await fetch_cookie_banner(true);
  if (next) await start_cookie_consent(next);
}
