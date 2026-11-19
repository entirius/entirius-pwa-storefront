// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// Spam trap of the contact forms: invisible to people and assistive tech, bots fill it. A form checks
// that its `website` value is empty before it sends.
export const HONEYPOT_NAME = "website";

export function HoneypotField() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website
        <input name={HONEYPOT_NAME} type="text" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
