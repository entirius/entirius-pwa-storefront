// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import type { CmsSectionData } from "@/types/cms.types";
import { render_cms_component } from "./cms-renderer";

const wrapper_props = (data: CmsSectionData) =>
  (render_cms_component(data, 0) as ReactElement<Record<string, unknown>>).props;

describe("section variant", () => {
  it("leaves the attribute out without a variant", () => {
    const props = wrapper_props({ core_type: "section-text" });
    expect(props["data-cms-type"]).toBe("section-text");
    expect(props["data-cms-variant"]).toBeUndefined();
  });

  it("names the variant on the wrapper", () => {
    const props = wrapper_props({ core_type: "section-text", variant: 2 });
    expect(props["data-cms-variant"]).toBe(2);
  });
});
