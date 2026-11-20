// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { MessagePage } from "@theme/components/message-page";
import { cancel_stock_alert } from "@/lib/stock-alerts";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

type Status = "pending" | "cancelled" | "failed";

// The cancel link of the back-in-stock mails (/stock-alert/cancel?token=): sends the token once and reports the
// result. A missing token is a failure known during render.
export function StockAlertCancelClient() {
  const { t } = useI18n();
  const token = useSearchParams().get("token");
  const api = useMemo(() => create_api(make_client_access()), []);
  const [status, setStatus] = useState<Status>(() => (token ? "pending" : "failed"));
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || !token) return;
    fired.current = true;
    cancel_stock_alert(api, token).then(setStatus);
  }, [api, token]);

  // The data attribute names the result for tests and a theme's rules, whatever the theme's page draws.
  return (
    <div data-stock-alert-cancel={status}>
      <MessagePage
        pending={status === "pending"}
        pending_text={t("stockAlert.cancel_pending")}
        title={status === "cancelled" ? t("stockAlert.cancel_done") : t("stockAlert.cancel_failed")}
        action={{ label: t("stockAlert.cancel_back"), href: "/" }}
      />
    </div>
  );
}
