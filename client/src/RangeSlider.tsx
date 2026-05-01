import { useRef, useState, type PointerEvent } from "react";

export type RangeSliderMarker = {
  value: number;
  label: string;
};

type RangeSliderProps = {
  min: number;
  max: number;
  minDistance: number;
  value: [number, number];
  markers?: RangeSliderMarker[];
  ariaLabel: string;
  onChange: (value: [number, number]) => void;
};

type ActiveHandle = "min" | "max";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getPercent(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
}

export function RangeSlider(props: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeHandle, setActiveHandle] = useState<ActiveHandle | null>(null);

  const updateValueFromClientX = (
    clientX: number,
    handle: ActiveHandle,
  ) => {
    const track = trackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const percent = clamp((clientX - rect.left) / rect.width, 0, 1);
    const nextValue = Math.round(props.min + percent * (props.max - props.min));
    let [nextMin, nextMax] = props.value;

    if (handle === "min") {
      nextMin = clamp(nextValue, props.min, props.max - props.minDistance);

      if (nextMax - nextMin < props.minDistance) {
        const pushedMax = nextMin + props.minDistance;
        if (pushedMax <= props.max) {
          nextMax = pushedMax;
        } else {
          nextMin = nextMax - props.minDistance;
        }
      }
    } else {
      nextMax = clamp(nextValue, props.min + props.minDistance, props.max);

      if (nextMax - nextMin < props.minDistance) {
        const pushedMin = nextMax - props.minDistance;
        if (pushedMin >= props.min) {
          nextMin = pushedMin;
        } else {
          nextMax = nextMin + props.minDistance;
        }
      }
    }

    props.onChange([nextMin, nextMax]);
  };

  const startDrag = (
    event: PointerEvent<HTMLButtonElement>,
    handle: ActiveHandle,
  ) => {
    event.preventDefault();
    setActiveHandle(handle);
    event.currentTarget.setPointerCapture(event.pointerId);
    updateValueFromClientX(event.clientX, handle);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!activeHandle) return;
    updateValueFromClientX(event.clientX, activeHandle);
  };

  const stopDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setActiveHandle(null);
  };

  const [minValue, maxValue] = props.value;
  const minPercent = getPercent(minValue, props.min, props.max);
  const maxPercent = getPercent(maxValue, props.min, props.max);

  return (
    <div className="range-slider" aria-label={props.ariaLabel}>
      <div ref={trackRef} className="range-slider__track">
        <span
          className="range-slider__handle-label"
          style={{ left: `${minPercent}%` }}
        >
          {minValue}
        </span>
        <span
          className="range-slider__handle-label"
          style={{ left: `${maxPercent}%` }}
        >
          {maxValue}
        </span>
        <div
          className="range-slider__selection"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />
        {props.markers?.map((marker) => {
          const isEndpoint = marker.value === props.min || marker.value === props.max;

          return (
          <div
            className={[
              "range-slider__marker",
              isEndpoint ? "range-slider__marker--endpoint" : "",
            ].filter(Boolean).join(" ")}
            key={`${marker.value}:${marker.label}`}
            style={{ left: `${getPercent(marker.value, props.min, props.max)}%` }}
          >
            {isEndpoint ? null : <span className="range-slider__marker-dot" />}
            <span className="range-slider__marker-label">{marker.label}</span>
          </div>
          );
        })}
        <button
          type="button"
          className="range-slider__handle"
          aria-label="Minimum rating"
          aria-valuemin={props.min}
          aria-valuemax={props.max}
          aria-valuenow={minValue}
          role="slider"
          style={{ left: `${minPercent}%` }}
          onPointerDown={(event) => startDrag(event, "min")}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
        />
        <button
          type="button"
          className="range-slider__handle"
          aria-label="Maximum rating"
          aria-valuemin={props.min}
          aria-valuemax={props.max}
          aria-valuenow={maxValue}
          role="slider"
          style={{ left: `${maxPercent}%` }}
          onPointerDown={(event) => startDrag(event, "max")}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
        />
      </div>
    </div>
  );
}
