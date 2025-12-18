'use client';

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type Position = { x: number; y: number };

export type UndockedWindowProps = {
  /**
   * Primary title shown in the header.
   */
  title: string;

  /**
   * Optional small label shown above the title (e.g., "Players").
   */
  sectionLabel?: string;

  /**
   * Called when the user requests to close the window (via X or backdrop click).
   */
  onClose: () => void;

  /**
   * Window body content (usually a form or screen).
   */
  children: ReactNode;

  /**
   * Initial top-left position in pixels.
   * This is intentionally uncontrolled; the component manages drag state internally.
   */
  initialPosition?: Position;

  /**
   * Max width for the window container (Tailwind class).
   */
  maxWidthClassName?: string;
};

/**
 * UndockedWindow
 *
 * A reusable, draggable "window" wrapper intended for forms/screens that should
 * float above the current page without a full navigation context switch.
 *
 * Limitations:
 * - Like all DOM UI, this window cannot be dragged outside the browser viewport.
 *
 * Behavior:
 * - Click outside the window closes it.
 * - Dragging is initiated from the header area (excluding interactive controls).
 * - Pointer events are used for mouse + touch support.
 */
export default function UndockedWindow({
  title,
  sectionLabel,
  onClose,
  children,
  initialPosition,
  maxWidthClassName = "max-w-[680px]",
}: UndockedWindowProps) {
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const defaultPosition = useMemo<Position>(() => ({ x: 120, y: 120 }), []);
  const [position, setPosition] = useState<Position>(
    initialPosition ?? defaultPosition
  );

  const dragStateRef = useRef<{
    startPointerX: number;
    startPointerY: number;
    startX: number;
    startY: number;
  } | null>(null);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || !dragStateRef.current) return;

      const dx = event.clientX - dragStateRef.current.startPointerX;
      const dy = event.clientY - dragStateRef.current.startPointerY;

      // Best-effort bounds: prevent dragging completely off-screen.
      const nextX = Math.max(8, dragStateRef.current.startX + dx);
      const nextY = Math.max(8, dragStateRef.current.startY + dy);

      setPosition({ x: nextX, y: nextY });
    };

    const onPointerUp = () => {
      setDragging(false);
      dragStateRef.current = null;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [dragging]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const onPointerDown = (event: PointerEvent) => {
      // Only primary button begins dragging.
      if (event.button !== 0) return;

      // Don't start dragging when the user clicks a control in the header.
      if (
        event.target instanceof Element &&
        event.target.closest("button, a, input, textarea, select")
      ) {
        return;
      }

      setDragging(true);
      dragStateRef.current = {
        startPointerX: event.clientX,
        startPointerY: event.clientY,
        startX: position.x,
        startY: position.y,
      };

      header.setPointerCapture(event.pointerId);
    };

    header.addEventListener("pointerdown", onPointerDown);
    return () => header.removeEventListener("pointerdown", onPointerDown);
  }, [position.x, position.y]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-start bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidthClassName} rounded-3xl bg-[#0b1220]/95 text-white shadow-[0_30px_80px_rgba(0,0,0,0.7)] ring-1 ring-white/10 backdrop-blur`}
        style={{ position: "absolute", left: position.x, top: position.y }}
      >
        <div
          ref={headerRef}
          className="flex cursor-grab items-center justify-between gap-4 rounded-t-3xl border-b border-white/10 px-6 py-4 active:cursor-grabbing"
        >
          <div className="min-w-0">
            {sectionLabel && (
              <p className="text-xs font-semibold tracking-wide text-indigo-200/90">
                {sectionLabel}
              </p>
            )}
            <h2 className="mt-1 truncate text-xl font-semibold leading-7">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
          >
            ×
          </button>
        </div>

        <div className="p-6 sm:p-10">{children}</div>
      </div>
    </div>
  );
}

