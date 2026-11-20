// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CmsSectionFaqProps } from "@entirius/storefront-sdk/cms";
import { RichText } from "@entirius/storefront-sdk/components/rich-text";

// An article's questions and answers. The answers stay in the page, not in an accordion: they are what the post's
// FAQPage data names. `anchor` is the last entry of the post's table of contents.
export function SectionFaq({ title, items, anchor }: CmsSectionFaqProps) {
  if (!items.length) return null;
  return (
    <section id={anchor} className="w-full scroll-mt-20 py-8 md:scroll-mt-32">
      <div className="surface flex flex-col gap-6">
        {title && <h2 className="text-2xl md:text-3xl">{title}</h2>}
        <dl className="flex flex-col gap-5">
          {items.map((item, i) => (
            <div key={`${i}-${item.question}`} className="flex flex-col gap-2">
              <dt className="text-lg">{item.question}</dt>
              {item.answer && (
                <dd>
                  <RichText html={item.answer} />
                </dd>
              )}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
