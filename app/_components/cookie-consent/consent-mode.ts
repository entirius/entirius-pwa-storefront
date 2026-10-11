import type {
  BANNER_CATEGORY,
  CONSENT_SIGNAL,
  CONSENT_STATE,
} from "./consent.d";

const SIGNALS: CONSENT_SIGNAL[] = [
  "ad_storage",
  "analytics_storage",
  "ad_user_data",
  "ad_personalization",
];

// A signal is granted when an accepted category lists it in consent_mode.
export function consent_state(
  accepted: string[],
  categories: BANNER_CATEGORY[],
): CONSENT_STATE {
  const granted = new Set(
    categories
      .filter((category) => accepted.includes(category.key))
      .flatMap((category) => category.consent_mode),
  );
  return Object.fromEntries(
    SIGNALS.map((signal) => [signal, granted.has(signal) ? "granted" : "denied"]),
  ) as CONSENT_STATE;
}

type GTAG = (command: "consent", action: "update", state: CONSENT_STATE) => void;

// The single place a tag learns about the decision. The storefront ships no tags: the call reaches
// gtag only when a page defines it. A new tag (Ads, UET, Clarity) adds its consent update here.
export function apply_consent(state: CONSENT_STATE) {
  (window as { gtag?: GTAG }).gtag?.("consent", "update", state);
}
