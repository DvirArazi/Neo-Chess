import type { MouseEvent, PointerEvent, ReactNode } from "react";
import { useRef, useState } from "react";

const SWIPE_THRESHOLD_PX = 48;
const CLICK_SUPPRESSION_THRESHOLD_PX = 8;
const PANEL_GAP_PX = 64;

export type TabPanelItem = {
  id: string;
  label: string;
  isLocked?: boolean;
  content: ReactNode;
};

type TabPanelProps = {
  items: TabPanelItem[];
  activeTabId: string;
  onChange: (tabId: string) => void;
  isSwipeLocked?: boolean;
};

export function TabPanel(props: TabPanelProps) {
  const activeIndex = Math.max(
    0,
    props.items.findIndex((item) => item.id === props.activeTabId),
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const swipeStartXRef = useRef<number | null>(null);
  const dragOffsetPxRef = useRef(0);
  const hasSwipeCaptureRef = useRef(false);
  const suppressNextClickRef = useRef(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const isSwipeExcludedTarget = (target: EventTarget | null): boolean => {
    return target instanceof Element &&
      target.closest(
        "input, textarea, select, label, [role='slider'], [data-tab-swipe-excluded='true']",
      ) !== null;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (props.isSwipeLocked) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    if (isSwipeExcludedTarget(event.target)) {
      return;
    }

    pointerIdRef.current = event.pointerId;
    swipeStartXRef.current = event.clientX;
    dragOffsetPxRef.current = 0;
    hasSwipeCaptureRef.current = false;
    setDragOffsetPx(0);
    setIsDragging(false);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;

    const swipeStartX = swipeStartXRef.current;
    if (swipeStartX === null) return;

    const nextDragOffsetPx = event.clientX - swipeStartX;
    dragOffsetPxRef.current = nextDragOffsetPx;
    setDragOffsetPx(nextDragOffsetPx);

    if (!isDragging && Math.abs(nextDragOffsetPx) > CLICK_SUPPRESSION_THRESHOLD_PX) {
      setIsDragging(true);
    }

    if (Math.abs(nextDragOffsetPx) <= CLICK_SUPPRESSION_THRESHOLD_PX) {
      return;
    }

    event.preventDefault();
    if (!hasSwipeCaptureRef.current) {
      event.currentTarget.setPointerCapture(event.pointerId);
      hasSwipeCaptureRef.current = true;
    }
  };

  const resetDrag = () => {
    pointerIdRef.current = null;
    swipeStartXRef.current = null;
    dragOffsetPxRef.current = 0;
    hasSwipeCaptureRef.current = false;
    setDragOffsetPx(0);
    setIsDragging(false);
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;

    const finalDragOffsetPx = dragOffsetPxRef.current;
    const nextIndex = finalDragOffsetPx <= -SWIPE_THRESHOLD_PX
      ? Math.min(props.items.length - 1, activeIndex + 1)
      : finalDragOffsetPx >= SWIPE_THRESHOLD_PX
      ? Math.max(0, activeIndex - 1)
      : activeIndex;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    resetDrag();
    if (Math.abs(finalDragOffsetPx) > CLICK_SUPPRESSION_THRESHOLD_PX) {
      suppressNextClickRef.current = true;
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 0);
    }

    if (nextIndex !== activeIndex) {
      props.onChange(props.items[nextIndex].id);
    }
  };

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    resetDrag();
  };

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!suppressNextClickRef.current) return;

    suppressNextClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const tabWidthPercent = 100 / Math.max(1, props.items.length);
  const trackTransform = containerRef.current
    ? `translateX(calc(${-activeIndex * 100}% - ${
      activeIndex * PANEL_GAP_PX
    }px + ${dragOffsetPx}px))`
    : `translateX(calc(${-activeIndex * 100}% - ${
      activeIndex * PANEL_GAP_PX
    }px))`;

  return (
    <div className="tab-panel">
      <div
        ref={containerRef}
        className="tab-panel__viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerCancel}
        onClickCapture={handleClickCapture}
      >
        <div
          className={[
            "tab-panel__track",
            isDragging ? "tab-panel__track--dragging" : "",
          ].filter(Boolean).join(" ")}
          style={{
            gap: `${PANEL_GAP_PX}px`,
            transform: trackTransform,
          }}
        >
          {props.items.map((item) => (
            <section
              key={item.id}
              className="tab-panel__panel"
              aria-hidden={item.id !== props.activeTabId}
            >
              {item.content}
            </section>
          ))}
        </div>
      </div>

      <nav className="tab-panel__tabs" aria-label="Game type">
        <div
          className="tab-panel__indicator"
          style={{
            width: `${tabWidthPercent}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />

        {props.items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={[
              "tab-panel__tab",
              item.id === props.activeTabId ? "tab-panel__tab--active" : "",
              item.isLocked ? "tab-panel__tab--locked" : "",
            ].filter(Boolean).join(" ")}
            aria-disabled={item.isLocked || undefined}
            onClick={() => props.onChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
