type GridRect = {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
};

const CANVAS_COLS = 12;
const CANVAS_ROWS = 24;

function toFiniteNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function sanitizeGridRect(input?: GridRect): { x: number; y: number; w: number; h: number } {
  const x = clamp(toFiniteNumber(input?.x, 0), 0, CANVAS_COLS - 1);
  const y = clamp(toFiniteNumber(input?.y, 0), 0, CANVAS_ROWS - 1);
  const w = clamp(toFiniteNumber(input?.w, CANVAS_COLS), 1, CANVAS_COLS);
  const h = clamp(toFiniteNumber(input?.h, 4), 1, CANVAS_ROWS);

  return {
    x: clamp(x, 0, CANVAS_COLS - w),
    y: clamp(y, 0, CANVAS_ROWS - h),
    w,
    h
  };
}

export function gridRectToInlineStyle(input?: GridRect): string {
  const rect = sanitizeGridRect(input);
  const left = (rect.x / CANVAS_COLS) * 100;
  const top = (rect.y / CANVAS_ROWS) * 100;
  const width = (rect.w / CANVAS_COLS) * 100;
  const height = (rect.h / CANVAS_ROWS) * 100;

  return `left:${left}%;top:${top}%;width:${width}%;height:${height}%;`;
}

