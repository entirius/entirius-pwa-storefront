"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { client_activate } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LinkDynamic } from "@/lib/link-dynamic";

// Email double-opt-in receiver. The confirmation link is /user-handler?key=&uid=;
// we POST it to the activation endpoint and report the result. Activation returns
// no tokens — the user signs in afterwards (the header User icon opens the Sheet).
export function UserHandlerClient() {
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      {status === "pending" && (
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-6" />
          <p className="text-muted-foreground">Verifying your account…</p>
        </div>
      )}

      {status === "success" && (
        <>
          <h1 className="mb-3 text-2xl font-bold">Verification complete</h1>
          <p className="text-muted-foreground mb-6">
            Your account has been verified. You can now sign in.
          </p>
          <Button asChild variant="outline">
            <LinkDynamic href="/">Sign in</LinkDynamic>
          </Button>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="mb-3 text-2xl font-bold">Verification failed</h1>
          <p className="text-muted-foreground mb-6">
            Something went wrong verifying your account. The link may be invalid
            or expired.
          </p>
          <Button asChild variant="outline">
            <LinkDynamic href="/">Back to store</LinkDynamic>
          </Button>
        </>
      )}
    </div>
  );
}
