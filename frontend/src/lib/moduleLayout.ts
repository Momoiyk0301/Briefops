export type GridRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ResizeParams = {
  current: GridRect;
  others: GridRect[];
  deltaW: number;
  deltaH: number;
  minW: number;
  minH: number;
  maxW: number;
  maxH: number;
  cols: number;
  rows: number;
};

function intersects(a: GridRect, b: GridRect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function tryResizeModuleRect(params: ResizeParams): GridRect | null {
  const { current, others, deltaW, deltaH, minW, minH, maxW, maxH, cols, rows } = params;

  const boundedMaxW = Math.min(maxW, cols - current.x);
  const boundedMaxH = Math.min(maxH, rows - current.y);

  const next: GridRect = {
    x: current.x,
    y: current.y,
    w: Math.max(minW, Math.min(boundedMaxW, current.w + deltaW)),
    h: Math.max(minH, Math.min(boundedMaxH, current.h + deltaH))
  };

  if (next.w === current.w && next.h === current.h) return null;
  if (next.x < 0 || next.y < 0 || next.x + next.w > cols || next.y + next.h > rows) return null;

  const hasCollision = others.some((rect) => intersects(next, rect));
  if (hasCollision) return null;

  return next;
}
