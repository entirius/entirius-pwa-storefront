// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";
import { Coins, Globe } from "lucide-react";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { useLayout } from "@entirius/storefront-sdk/layout/context";
import { useLocaleSwitch } from "@entirius/storefront-sdk/storefront";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@theme/ui/select";
import { cn } from "@theme/lib/utils";
import { HEADER_ICON } from "@theme/layout/header-icon";

type Props = {
  className?: string;
  // Icons among the header's buttons instead of labelled fields; the value stays for screen readers.
  icons?: boolean;
};

const TRIGGER = "h-8 w-auto gap-1 px-2 text-xs";
const ICON_TRIGGER =
  "size-9 justify-center gap-0 border-0 p-0 shadow-none hover:bg-accent dark:bg-transparent [&>svg:last-child]:hidden";
const ICON = cn(HEADER_ICON, "text-foreground");

// Writes the lg / cr cookies (the proxy keeps them, the API layer sends them), drops the client
// query cache (keys carry no language or currency) and re-renders the server tree.
// Language and currency of the visitor's country; nothing when it offers one of each.
export function LocaleSwitch({ className, icons }: Props) {
  const { locale } = useLayout();
  return locale && <LocaleSelects {...locale} className={className} icons={icons} />;
}

function LocaleSelects({
  languages,
  currencies,
  language,
  currency,
  className,
  icons,
}: Props & { languages: string[]; currencies: string[]; language: string; currency: string }) {
  const { t } = useI18n();
  const { pending, change_language, change_currency } = useLocaleSwitch();
  const names = new Intl.DisplayNames([language], { type: "language" });

  return (
    <div data-locale-switch aria-busy={pending} className={cn("items-center", icons ? "gap-2" : "gap-1", className ?? "flex")}>
      {languages.length > 1 && (
        <Select value={language} onValueChange={change_language}>
          <SelectTrigger data-locale-language aria-label={t("header.language")} className={icons ? ICON_TRIGGER : TRIGGER}>
            {icons && <Globe className={ICON} aria-hidden />}
            {/* The label is given, not read from the items: those exist only in the browser, so an empty value
                in the server HTML would grow at hydration and push the rest of the row aside. */}
            <span className={icons ? "sr-only" : "contents"}>
              <SelectValue>{names.of(language) ?? language.toUpperCase()}</SelectValue>
            </span>
          </SelectTrigger>
          <SelectContent>
            {languages.map((code) => (
              <SelectItem key={code} value={code}>
                {names.of(code) ?? code.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {currencies.length > 1 && (
        <Select value={currency} onValueChange={change_currency}>
          <SelectTrigger data-locale-currency aria-label={t("header.currency")} className={icons ? ICON_TRIGGER : TRIGGER}>
            {icons && <Coins className={ICON} aria-hidden />}
            <span className={icons ? "sr-only" : "contents"}>
              <SelectValue>{currency.toUpperCase()}</SelectValue>
            </span>
          </SelectTrigger>
          <SelectContent>
            {currencies.map((code) => (
              <SelectItem key={code} value={code}>
                {code.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
