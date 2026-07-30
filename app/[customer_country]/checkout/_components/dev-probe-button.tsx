"use client";

import { useMemo, useState } from "react";
import { make_client_access } from "@/API/access/api.client-access";
import { create_api } from "@/API/api.context";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

// DEBUG-only: fires a raw request through the client fetch engine (resolves
// __CHANNEL__/__CART_ID__ + x-api-key from cookies, same as the real calls) so the
// request shows up in the Network tab. Also echoes status + body inline. Used to
// poke the currently-500 shipping/payment method lists.
export function DevProbeButton({
  label,
  route,
  method = "GET",
  body,
}: {
  label: string;
  route: string;
  method?: string;
  body?: unknown;
}) {
  const api = useMemo(() => create_api(make_client_access()), []);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const run = async () => {
    setPending(true);
    setResult(null);
    const init =
      body != null ? { method, body: JSON.stringify(body) } : { method };
    const [error, data, meta] = await api.FETCH_METHOD(route, init);
    const status =
      meta?.status ?? (error as { status?: number } | undefined)?.status ?? "?";
    const res_body = error
      ? ((error as { body?: unknown }).body ?? error.message)
      : data;
    setResult(`HTTP ${status}\n${JSON.stringify(res_body, null, 2)}`.slice(0, 1200));
    setPending(false);
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-xs">
      <div className="flex items-center gap-2">
        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-400">
          dev
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={run}
          disabled={pending}
        >
          {pending ? <Spinner className="size-4" /> : label}
        </Button>
      </div>
      <p className="text-amber-700/80 dark:text-amber-400/80">
        Debug-only — fires the request so you can inspect it in the Network tab.
      </p>
      {result && (
        <pre className="max-h-48 overflow-auto rounded bg-background/60 p-2 font-mono text-[11px] whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
}
