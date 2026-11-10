// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { beforeEach, describe, expect, it } from "vitest";
import { ERROR_TIMEOUT, MAX_NOTICES, NOTICE_TIMEOUT, dismiss_notice, notify, useNotices } from "./notices.store";

const messages = () => useNotices.getState().notices.map((n) => n.message);

describe("notices", () => {
  beforeEach(() => useNotices.setState({ notices: [] }));

  it("shows a positive notice by default and an error for longer", () => {
    notify({ message: "wishlist.added" });
    notify({ message: "wishlist.update_failed", tone: "destructive" });
    const [saved, failed] = useNotices.getState().notices;
    expect(saved).toMatchObject({ tone: "positive", timeout: NOTICE_TIMEOUT });
    expect(failed).toMatchObject({ tone: "destructive", timeout: ERROR_TIMEOUT });
  });

  it("replaces the same message instead of stacking it", () => {
    const first = notify({ message: "wishlist.added" });
    notify({ message: "catalog.quick_add_failed", params: { name: "Sofa" } });
    const second = notify({ message: "wishlist.added" });
    expect(second).not.toBe(first);
    expect(messages()).toEqual(["catalog.quick_add_failed", "wishlist.added"]);
  });

  it("keeps the same message with other parameters apart", () => {
    notify({ message: "catalog.quick_add_failed", params: { name: "Sofa" } });
    notify({ message: "catalog.quick_add_failed", params: { name: "Chair" } });
    expect(useNotices.getState().notices).toHaveLength(2);
  });

  it("drops the oldest notice past the limit", () => {
    for (const name of ["A", "B", "C", "D"]) notify({ message: "catalog.quick_add_failed", params: { name } });
    const names = useNotices.getState().notices.map((n) => n.params?.name);
    expect(names).toHaveLength(MAX_NOTICES);
    expect(names).toEqual(["B", "C", "D"]);
  });

  it("clears them all", () => {
    notify({ message: "wishlist.added" });
    notify({ message: "wishlist.update_failed", tone: "destructive" });
    useNotices.getState().clear();
    expect(messages()).toEqual([]);
  });

  it("dismisses one notice by its id", () => {
    const saved = notify({ message: "wishlist.added" });
    notify({ message: "wishlist.update_failed", tone: "destructive" });
    dismiss_notice(saved);
    expect(messages()).toEqual(["wishlist.update_failed"]);
  });
});
