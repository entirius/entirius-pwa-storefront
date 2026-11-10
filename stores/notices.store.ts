// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { create } from "zustand";
import type { MessageKey } from "@/lib/i18n/translate";
import type { Params } from "@/lib/i18n/types";

// The tones are the status colour tokens of app/globals.css.
export type NoticeTone = "positive" | "destructive" | "notice" | "informative";

export type NoticeInput = {
  message: MessageKey;
  params?: Params;
  title?: MessageKey;
  tone?: NoticeTone;
  // How long it stays, while neither the pointer nor the focus is on it.
  timeout?: number;
  // One button or link next to the message (View wishlist, View cart); the notice closes when it is used.
  action?: { label: MessageKey; run: () => void } | { label: MessageKey; href: string };
};

export type Notice = NoticeInput & { id: number; tone: NoticeTone; timeout: number };

export const NOTICE_TIMEOUT = 5000;
// An error waits longer: it asks the visitor to do something.
export const ERROR_TIMEOUT = 8000;
// Older notices go when a new one would make the stack longer: a burst of errors never covers the page.
export const MAX_NOTICES = 3;

type NoticesStore = {
  notices: Notice[];
  notify: (input: NoticeInput) => number;
  dismiss: (id: number) => void;
  clear: () => void;
};

let last_id = 0;

const same = (a: NoticeInput, b: NoticeInput) =>
  a.message === b.message && JSON.stringify(a.params ?? {}) === JSON.stringify(b.params ?? {});

// Short messages after an action, stacked under the header (app/_components/layout/notices.client.tsx). The store
// holds message keys, not text, so code outside React (stores/wishlist-sync.ts) can call notify() too. The same
// message again replaces the one showing and starts its time anew.
export const useNotices = create<NoticesStore>()((set) => ({
  notices: [],
  notify: (input) => {
    const tone = input.tone ?? "positive";
    const notice: Notice = {
      ...input,
      id: ++last_id,
      tone,
      timeout: input.timeout ?? (tone === "destructive" ? ERROR_TIMEOUT : NOTICE_TIMEOUT),
    };
    set((s) => ({ notices: [...s.notices.filter((n) => !same(n, input)), notice].slice(-MAX_NOTICES) }));
    return notice.id;
  },
  dismiss: (id) => set((s) => ({ notices: s.notices.filter((n) => n.id !== id) })),
  clear: () => set({ notices: [] }),
}));

export const notify = (input: NoticeInput) => useNotices.getState().notify(input);
export const dismiss_notice = (id: number) => useNotices.getState().dismiss(id);
