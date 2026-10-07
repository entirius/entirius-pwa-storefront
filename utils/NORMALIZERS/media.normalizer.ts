// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { API_BASE_URL } from "@/_CONFIG/app.config.json";

const placeholder_width = 600;
const placeholder_height = 600;
export const image_placeholder = "/placeholder.svg";

// ------------------------------------------------------------
// The backend returns media paths relative to its own host
// (`/media/image/...`). Left relative, next/image resolves them against the
// storefront and fails. Absolute URLs (e.g. a CDN) pass through untouched.
// ------------------------------------------------------------
export function resolve_media_uri(source: unknown): string {
  if (typeof source !== "string" || !source) return image_placeholder;
  if (/^https?:\/\//.test(source)) return source;
  return new URL(source, API_BASE_URL).toString();
}

// ------------------------------------------------------------
// sort_by - sort by position, type, source_set
// KVP - Key Value Pair
// ------------------------------------------------------------
type NORM_MEDIA_DATA_OPTIONS = {
  sort_by?: 'position' | 'type' | 'source_set';
  remove_kvp?: [string, string][];
};

type MEDIA = {
  uri: string;
  width: number;
  height: number;
};

// [ [{uri, width, height}, {uri, width, height}, {uri, width, height}], [{uri, width, height}, {uri, width, height}, {uri, width, height}] ]

function NORM_MEDIA_DATA(
  media: any[],
  options: NORM_MEDIA_DATA_OPTIONS = { sort_by: 'position' }
): MEDIA[][] {
  if (!media) {
    return [
      [
        {
          uri: image_placeholder,
          width: placeholder_width,
          height: placeholder_height,
        },
      ],
    ];
  }

  // resolve options if passed

  // ------------------------------------------------------------
  // remove kvp if passed
  // ------------------------------------------------------------
  if (options.remove_kvp && options.remove_kvp.length) {
    media = media.filter((item) => {
      // check if the item has the key value pair f.e. [['type', 'video']]
      const test = options.remove_kvp!.some(([key, value]) => {
        const itemValue = item[key as keyof typeof item] as unknown as string;
        return itemValue === value;
      });

      // ------------------------------------------------------------
      // if test is true, remove the item
      // ------------------------------------------------------------
      return !test;
    });
  }

  // ------------------------------------------------------------
  // sort by position, type, source_set
  // ------------------------------------------------------------
  if (options.sort_by && media.length) {
    media = media.sort((a, b) => {
      return (
        (a[options.sort_by as keyof typeof a] as number) -
        (b[options.sort_by as keyof typeof b] as number)
      );
    });
  }

  // ------------------------------------------------------------
  // return media
  // ------------------------------------------------------------
  return media.map((item: any) => {
    return item.source_set.map((n: any) => {
      return {
        uri: resolve_media_uri(n.source),
        width: n.width,
        height: n.height,
      };
    });
  });
}

export { NORM_MEDIA_DATA };
