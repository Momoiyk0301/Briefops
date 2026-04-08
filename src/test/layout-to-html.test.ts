import { describe, expect, it } from "vitest";

import { gridRectToInlineStyle } from "@/pdf/layoutToHtml";

describe("gridRectToInlineStyle", () => {
  it("converts grid coordinates to inline style percentages", () => {
    const style = gridRectToInlineStyle({ x: 3, y: 6, w: 6, h: 12 });
    expect(style).toBe("left:25%;top:25%;width:50%;height:50%;");
  });

  it("clamps out-of-range values", () => {
    const style = gridRectToInlineStyle({ x: -10, y: 50, w: 50, h: -4 });
    expect(style).toBe("left:0%;top:95.83333333333334%;width:100%;height:4.166666666666666%;");
  });
});

