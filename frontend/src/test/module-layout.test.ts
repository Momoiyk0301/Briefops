import { describe, expect, it } from "vitest";

import { tryResizeModuleRect } from "@/lib/moduleLayout";

describe("tryResizeModuleRect", () => {
  it("resizes inside page boundaries", () => {
    const next = tryResizeModuleRect({
      current: { x: 0, y: 0, w: 4, h: 3 },
      others: [],
      deltaW: 2,
      deltaH: 1,
      minW: 2,
      minH: 2,
      maxW: 12,
      maxH: 8,
      cols: 12,
      rows: 24
    });

    expect(next).toEqual({ x: 0, y: 0, w: 6, h: 4 });
  });

  it("blocks resize when it would collide with another module", () => {
    const next = tryResizeModuleRect({
      current: { x: 0, y: 0, w: 4, h: 4 },
      others: [{ x: 5, y: 0, w: 4, h: 4 }],
      deltaW: 2,
      deltaH: 0,
      minW: 2,
      minH: 2,
      maxW: 12,
      maxH: 8,
      cols: 12,
      rows: 24
    });

    expect(next).toBeNull();
  });

  it("blocks resize outside page bounds", () => {
    const next = tryResizeModuleRect({
      current: { x: 10, y: 20, w: 2, h: 4 },
      others: [],
      deltaW: 2,
      deltaH: 3,
      minW: 1,
      minH: 1,
      maxW: 12,
      maxH: 20,
      cols: 12,
      rows: 24
    });

    expect(next).toBeNull();
  });
});
