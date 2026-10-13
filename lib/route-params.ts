// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// A dynamic segment outside ASCII reaches the page still percent-encoded (`rega%C5%82`; generateMetadata gets
// it decoded), and the API engine encodes query values itself, so a url_key is decoded before it is used.
// Decoding is idempotent for real keys; a malformed escape is kept as it came.
export function decode_param(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
