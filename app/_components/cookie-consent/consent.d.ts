type CONSENT_SIGNAL =
  | "ad_storage"
  | "analytics_storage"
  | "ad_user_data"
  | "ad_personalization";

type CONSENT_STATE = Record<CONSENT_SIGNAL, "granted" | "denied">;

type BANNER_CATEGORY = {
  key: string;
  required: boolean;
  consent_mode: CONSENT_SIGNAL[];
  label: string;
  description: string;
};

// GET /api/agreements/v2/{channel}/cookie-banner/ (django-agreements >= 2.2.0). Texts are sanitised HTML.
type COOKIE_BANNER = {
  revision: number;
  language: string;
  max_age_days: number;
  text: string;
  buttons: {
    accept_all: string;
    reject_all: string;
    customize: string;
    save: string;
  };
  preferences_title: string | null;
  close_label: string | null;
  categories: BANNER_CATEGORY[];
};

type CONSENT_ACTION = "accept_all" | "reject_all" | "custom" | "withdraw";

type CONSENT_PAYLOAD = {
  consent_id: string;
  revision: number;
  language: string;
  action: CONSENT_ACTION;
  categories: Record<string, boolean>;
};

export {
  CONSENT_SIGNAL,
  CONSENT_STATE,
  BANNER_CATEGORY,
  COOKIE_BANNER,
  CONSENT_ACTION,
  CONSENT_PAYLOAD,
};
