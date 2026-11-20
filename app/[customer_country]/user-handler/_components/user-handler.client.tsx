// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { client_activate } from "@/lib/auth-client";
import { MessagePage } from "@theme/components/message-page";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

// Email double-opt-in receiver. The confirmation link is /user-handler?key=&uid=;
// we POST it to the activation endpoint and report the result. Activation returns
// no tokens — the user signs in afterwards (the header User icon opens the Sheet).
export function UserHandlerClient() {
  const { t } = useI18n();
  const params = useSearchParams();
  const key = params.get("key");
  const uid = params.get("uid");
  // A missing key/uid is an error we can derive during render — no effect needed.
  const [status, setStatus] = useState<"pending" | "success" | "error">(() =>
    key && uid ? "pending" : "error",
  );
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || !key || !uid) return;
    fired.current = true;

    client_activate(uid, key).then((res) =>
      setStatus(res.ok ? "success" : "error"),
    );
  }, [key, uid]);

  const ok = status === "success";
  return (
    <MessagePage
      pending={status === "pending"}
      pending_text={t("auth.verifying")}
      title={ok ? t("auth.verified_title") : t("auth.verify_failed_title")}
      text={ok ? t("auth.verified_text") : t("auth.verify_failed_text")}
      action={{ label: ok ? t("auth.sign_in") : t("common.back_to_store"), href: "/" }}
    />
  );
}
