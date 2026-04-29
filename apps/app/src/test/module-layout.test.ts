import { describe, expect, it } from "vitest";

import { tryMoveModuleRect, tryResizeModuleRect } from "@/lib/moduleLayout";

describe("module layout engine", () => {
  it("resizes progressively from south-east handle within boundaries", () => {
    const next = tryResizeModuleRect({
      current: { x: 0, y: 0, w: 4, h: 3 },
      others: [],
      handle: "se",
      deltaX: 2,
      deltaY: 1,
      minW: 2,
      minH: 2,
      maxW: 12,
      maxH: 8,
      cols: 12,
      rows: 24
    });

    expect(next).toEqual({ x: 0, y: 0, w: 6, h: 4, page: 0 });
  });

  it("blocks resize when touching another module", () => {
    const next = tryResizeModuleRect({
      current: { x: 0, y: 0, w: 4, h: 4 },
      others: [{ x: 6, y: 0, w: 3, h: 4 }],
      handle: "e",
      deltaX: 2,
      deltaY: 0,
      minW: 2,
      minH: 2,
      maxW: 12,
      maxH: 8,
      cols: 12,
      rows: 24
    });

    expect(next).toBeNull();
  });

  it("moves module when no collision", () => {
    const next = tryMoveModuleRect({
      current: { x: 1, y: 1, w: 3, h: 3 },
      others: [{ x: 8, y: 8, w: 2, h: 2 }],
      deltaX: 2,
      deltaY: 1,
      cols: 12,
      rows: 24
    });

    expect(next).toEqual({ x: 3, y: 2, w: 3, h: 3, page: 0 });
  });

  it("blocks move when touching another module", () => {
    const next = tryMoveModuleRect({
      current: { x: 1, y: 1, w: 3, h: 3 },
      others: [{ x: 5, y: 1, w: 3, h: 3 }],
      deltaX: 1,
      deltaY: 0,
      cols: 12,
      rows: 24
    });

    expect(next).toBeNull();
  });
});
