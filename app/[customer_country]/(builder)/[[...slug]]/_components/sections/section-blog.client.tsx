// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { useI18n } from "@/providers/i18n.provider";
import { PostTile } from "@/app/[customer_country]/blog/_components/post-tile.client";
import { SectionShell } from "./section-text";
import { blog_section_routes, cms_blog_posts_query } from "../../api.query";
import type { CmsButtonData } from "../cms-button";

// Post tiles the editor picked (`blog_section`: up to three post routes), e.g. "From the blog" on the home page.
// Each tile is the post's own (`extension`: title, summary, cover), linking to the post.
export default function SectionBlog({
  title,
  description,
  custom_buttons,
  blog_section,
  width,
}: {
  title?: string;
  description?: string;
  custom_buttons?: CmsButtonData[];
  blog_section?: unknown;
  width?: string;
}) {
  const { language } = useI18n();
  const routes = blog_section_routes(blog_section);
  const api = useMemo(() => create_api(make_client_access()), []);
  const { data: cards } = useQuery({ ...cms_blog_posts_query(api, routes, language), enabled: routes.length > 0 });

  if (!cards?.length) return null;

  return (
    <SectionShell title={title} description={description} custom_buttons={custom_buttons} width={width}>
      {/* The blog's grid: a tile keeps its size however many the editor picked. */}
      <ul data-blog-posts className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <li key={card.slug}>
            <PostTile card={card} heading={title ? "h3" : "h2"} />
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
