export type GridRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ResizeHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

export type ResizeParams = {
  current: GridRect;
  others: GridRect[];
  handle: ResizeHandle;
  deltaX: number;
  deltaY: number;
  minW: number;
  minH: number;
  maxW: number;
  maxH: number;
  cols: number;
  rows: number;
};

export type MoveParams = {
  current: GridRect;
  others: GridRect[];
  deltaX: number;
  deltaY: number;
  cols: number;
  rows: number;
};

function touchesOrIntersects(a: GridRect, b: GridRect) {
  return a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function tryMoveModuleRect(params: MoveParams): GridRect | null {
  const { current, others, deltaX, deltaY, cols, rows } = params;
  const next: GridRect = {
    x: clamp(current.x + deltaX, 0, cols - current.w),
    y: clamp(current.y + deltaY, 0, rows - current.h),
    w: current.w,
    h: current.h
  };

  if (next.x === current.x && next.y === current.y) return null;
  if (others.some((rect) => touchesOrIntersects(next, rect))) return null;
  return next;
}

export function tryResizeModuleRect(params: ResizeParams): GridRect | null {
  const { current, others, handle, deltaX, deltaY, minW, minH, maxW, maxH, cols, rows } = params;

  let x = current.x;
  let y = current.y;
  let w = current.w;
  let h = current.h;

  if (handle.includes("e")) {
    w += deltaX;
  }
  if (handle.includes("s")) {
    h += deltaY;
  }
  if (handle.includes("w")) {
    x += deltaX;
    w -= deltaX;
  }
  if (handle.includes("n")) {
    y += deltaY;
    h -= deltaY;
  }

  if (w < minW) {
    if (handle.includes("w")) x -= minW - w;
    w = minW;
  }
  if (h < minH) {
    if (handle.includes("n")) y -= minH - h;
    h = minH;
  }

  if (w > maxW) {
    if (handle.includes("w")) x += w - maxW;
    w = maxW;
  }
  if (h > maxH) {
    if (handle.includes("n")) y += h - maxH;
    h = maxH;
  }

  if (x < 0) {
    if (handle.includes("w")) {
      w += x;
    }
    x = 0;
  }
  if (y < 0) {
    if (handle.includes("n")) {
      h += y;
    }
    y = 0;
  }
  if (x + w > cols) {
    if (handle.includes("e")) {
      w = cols - x;
    } else {
      x = cols - w;
    }
  }
  if (y + h > rows) {
    if (handle.includes("s")) {
      h = rows - y;
    } else {
      y = rows - h;
    }
  }

  if (w < minW || h < minH) return null;

  const next: GridRect = { x, y, w, h };
  if (next.x === current.x && next.y === current.y && next.w === current.w && next.h === current.h) return null;
  if (others.some((rect) => touchesOrIntersects(next, rect))) return null;

  return next;
}
