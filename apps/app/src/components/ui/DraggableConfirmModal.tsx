import { PointerEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DraggableConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  loading = false,
  onConfirm,
  onCancel
}: Props) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const draggingRef = useRef<{ pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  useEffect(() => {
    if (!open) {
      setPosition({ x: 0, y: 0 });
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  const onHeaderPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!open) return;
    draggingRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: position.x,
      baseY: position.y
    };
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
  };

  const onHeaderPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragging = draggingRef.current;
    if (!dragging || dragging.pointerId !== event.pointerId) return;
    const nextX = dragging.baseX + (event.clientX - dragging.startX);
    const nextY = dragging.baseY + (event.clientY - dragging.startY);
    setPosition({ x: nextX, y: nextY });
  };

  const stopDrag = (event: PointerEvent<HTMLDivElement>) => {
    const dragging = draggingRef.current;
    if (!dragging || dragging.pointerId !== event.pointerId) return;
    draggingRef.current = null;
    (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
      <div
        className="w-full max-w-md rounded-2xl border border-[#e6e8f2] bg-white shadow-2xl dark:border-white/10 dark:bg-[#141414]"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="cursor-grab rounded-t-2xl border-b border-[#e6e8f2] px-4 py-3 active:cursor-grabbing dark:border-white/10"
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
        >
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs text-[#6f748a] dark:text-[#a8afc6]">Faites glisser cette fenetre pour la deplacer.</p>
        </div>

        <div className="px-4 py-4">
          {description ? <p className="text-sm text-[#2a3042] dark:text-[#dbe3ff]">{description}</p> : null}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
            <Button onClick={onConfirm} disabled={loading}>{loading ? "Suppression..." : confirmLabel}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
