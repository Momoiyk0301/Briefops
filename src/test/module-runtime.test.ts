import { describe, expect, it } from "vitest";

import { getVisibleFieldOptions, isFieldVisible } from "@/lib/moduleRuntime";
import { deliveryFieldDefinitions } from "@/lib/moduleRegistry";

describe("moduleRuntime", () => {
  it("evaluates value-based visibility rules", () => {
    const customTagField = deliveryFieldDefinitions.find((field) => field.key === "custom_tag");
    expect(customTagField).toBeTruthy();

    expect(
      isFieldVisible(customTagField!, { allow_custom_tag: true }, { tag_mode: "custom" })
    ).toBe(true);

    expect(
      isFieldVisible(customTagField!, { allow_custom_tag: true }, { tag_mode: "depot" })
    ).toBe(false);
  });

  it("filters delivery tag options from module settings", () => {
    const tagField = deliveryFieldDefinitions.find((field) => field.key === "tag_mode");
    expect(tagField).toBeTruthy();

    const options = getVisibleFieldOptions(
      tagField!,
      {
        enable_depot_tag: true,
        enable_retour_tag: false,
        allow_custom_tag: true
      },
      {}
    );

    expect(options.map((option) => option.value)).toEqual(["depot", "custom"]);
  });
});
