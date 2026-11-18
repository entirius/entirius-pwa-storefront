// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// The SKUs this browser has asked to be told about, per channel, so a saved request still shows as saved after a
// reload. Only SKUs: no address is ever stored in the browser. Storage may be missing, full or corrupted: every
// read and write is guarded, and a failure only means the form shows again.

export const STOCK_ALERT_MEMORY_LIMIT = 50;

const key = (channel: string) => `stock-alerts:${channel}`;

export function remembered_skus(channel: string): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key(channel)) ?? "[]");
    return Array.isArray(value) ? value.filter((sku): sku is string => typeof sku === "string") : [];
  } catch {
    return [];
  }
}

export function is_remembered(channel: string, sku: string): boolean {
  return remembered_skus(channel).includes(sku);
}

// Newest last; past the limit the oldest are dropped.
export function remember_sku(channel: string, sku: string): void {
  const skus = [...remembered_skus(channel).filter((s) => s !== sku), sku].slice(-STOCK_ALERT_MEMORY_LIMIT);
  try {
    localStorage.setItem(key(channel), JSON.stringify(skus));
  } catch {
    // Storage full or blocked: the request is saved in the backend all the same.
  }
}
