import type { PointerEvent, ReactNode } from "react";
import { useRef, useState } from "react";

const SWIPE_THRESHOLD_PX = 48;

export type TabPanelItem = {
  id: string;
  label: string;
  content: ReactNode;
};

type TabPanelProps = {
  items: TabPanelItem[];
  activeTabId: string;
  onChange: (tabId: string) => void;
};

export function TabPanel(props: TabPanelProps) {
  const activeIndex = Math.max(
    0,
    props.items.findIndex((item) => item.id === props.activeTabId),
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const swipeStartXRef = useRef<number | null>(null);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const isInteractiveTarget = (target: EventTarget | null): boolean => {
    return target instanceof Element &&
      target.closest("button, a, input, textarea, select, label") !== null;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isInteractiveTarget(event.target)) {
      return;
    }

    pointerIdRef.current = event.pointerId;
    swipeStartXRef.current = event.clientX;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;

    const swipeStartX = swipeStartXRef.current;
    if (swipeStartX === null) return;

    setDragOffsetPx(event.clientX - swipeStartX);
  };

  const resetDrag = () => {
    pointerIdRef.current = null;
    swipeStartXRef.current = null;
    setDragOffsetPx(0);
    setIsDragging(false);
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;

    const nextIndex = dragOffsetPx <= -SWIPE_THRESHOLD_PX
      ? Math.min(props.items.length - 1, activeIndex + 1)
      : dragOffsetPx >= SWIPE_THRESHOLD_PX
      ? Math.max(0, activeIndex - 1)
      : activeIndex;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    resetDrag();
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

  const tabWidthPercent = 100 / Math.max(1, props.items.length);
  const trackTransform = containerRef.current
    ? `translateX(calc(${-activeIndex * 100}% + ${dragOffsetPx}px))`
    : `translateX(${-activeIndex * 100}%)`;

  return (
    <div className="tab-panel">
      <div
        ref={containerRef}
        className="tab-panel__viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerCancel}
      >
        <div
          className={[
            "tab-panel__track",
            isDragging ? "tab-panel__track--dragging" : "",
          ].filter(Boolean).join(" ")}
          style={{ transform: trackTransform }}
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
            ].filter(Boolean).join(" ")}
            onClick={() => props.onChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
