// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Coins, Globe } from "lucide-react";
import { make_client_access } from "@/API/access/api.client-access";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n.provider";
import { HEADER_ICON } from "./header-icon";

type Props = {
  languages: string[];
  currencies: string[];
  language: string;
  currency: string;
  // language -> currency that goes with it (selecting the language also selects it)
  pairs: Record<string, string>;
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
export function LocaleSwitchClient({ languages, currencies, language, currency, pairs, className, icons }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const query_client = useQueryClient();
  const [pending, start] = useTransition();
  const names = new Intl.DisplayNames([language], { type: "language" });

  function apply(values: Record<string, string>) {
    const access = make_client_access();
    for (const [name, value] of Object.entries(values)) access.set?.(name, value);
    void query_client.invalidateQueries();
    start(() => router.refresh());
  }

  const change_language = (next: string) =>
    apply({ lg: next, ...(pairs[next] && { cr: pairs[next] }) });

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
        <Select value={currency} onValueChange={(next) => apply({ cr: next })}>
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
