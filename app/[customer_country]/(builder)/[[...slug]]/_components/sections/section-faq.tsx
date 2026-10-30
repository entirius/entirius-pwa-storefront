// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { SanitizeHTML } from "@/components/ui/sanitize-html";
import { FAQ_ANCHOR } from "@/utils/NORMALIZERS/blog-post.normalizer";

type FaqItem = { question?: string; answer?: string };

// Questions and answers of an article (AI Studio closes a post with one). Answers stay in the page, not in an
// accordion: they are what the post's FAQPage data names. The anchor is the post's table of contents' last entry.
export default function SectionFaq({ title, faq_items }: { title?: string; faq_items?: FaqItem[] }) {
  const items = (faq_items ?? []).filter((item) => item.question?.trim());
  if (!items.length) return null;
  return (
    <section id={FAQ_ANCHOR} className="w-full scroll-mt-20 md:scroll-mt-32 py-8">
      <div className="surface flex flex-col gap-6">
        {title && <h2 className="text-2xl md:text-3xl">{title}</h2>}
        <dl className="flex flex-col gap-5">
          {items.map((item, i) => (
            <div key={`${i}-${item.question}`} className="flex flex-col gap-2">
              <dt className="text-lg">{item.question}</dt>
              {item.answer && (
                <dd>
                  <SanitizeHTML html={item.answer} />
                </dd>
              )}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
