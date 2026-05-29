import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";

interface CompassProps {
  direction: number; // direction in degrees, 0 = North
  label: string;
  manipulatable?: boolean;
  onDirectionChange?: (deg: number) => void;
  /** When true, arrow points inward (outer-to-inner) to show wind blowing FROM that direction */
  arrowInward?: boolean;
}

const size = 240; // base size in viewBox units; scales via width/height
const center = size / 2;
const radius = center - 20;
/** Padding around the 240×240 content so rim labels (radius+22) stay inside the viewBox — avoids clipping/subpixel drift when zoomed on mobile. */
const VIEW_PAD = 20;
const viewBoxStr = `-${VIEW_PAD} -${VIEW_PAD} ${size + 2 * VIEW_PAD} ${size + 2 * VIEW_PAD}`;
const cardinalPoints = [
  { label: "N", angle: 0 },
  { label: "NE", angle: 45 },
  { label: "E", angle: 90 },
  { label: "SE", angle: 135 },
  { label: "S", angle: 180 },
  { label: "SW", angle: 225 },
  { label: "W", angle: 270 },
  { label: "NW", angle: 315 },
];

const arrowRimInset = 6;

export const Compass: React.FC<CompassProps> = ({
  direction,
  label,
  manipulatable,
  onDirectionChange,
  arrowInward,
}) => {
  const [dragging, setDragging] = useState(false);
  const [liveDeg, setLiveDeg] = useState<number | null>(null);
  const compassRef = useRef<SVGSVGElement>(null);
  /** True immediately on pointerdown; state updates async — real touch sends move before re-render. */
  const dragActiveRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  /** Removes window listeners + ends drag; set in pointerdown so cleanup runs even if React hasn't re-rendered. */
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const onDirectionChangeRef = useRef(onDirectionChange);
  useEffect(() => {
    onDirectionChangeRef.current = onDirectionChange;
  }, [onDirectionChange]);
  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
    };
  }, []);

  // Helper accepts a generic pointer event (React or native)
  const getAngleFromEvent = useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      const rect = compassRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      // Support both native and React pointer events
      const clientX = e.clientX;
      const clientY = e.clientY;
      // Account for potential CSS scaling by measuring relative to the rendered box
      const scaleX = rect.width / size;
      const scaleY = rect.height / size;
      const localX = (clientX - rect.left) / scaleX;
      const localY = (clientY - rect.top) / scaleY;
      const x = localX - center;
      const y = localY - center;
      let deg = (Math.atan2(x, -y) * 180) / Math.PI;
      if (deg < 0) deg += 360;
      return deg;
    },
    [],
  );

  // On inside-pointerdown, start drag and capture pointer
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!manipulatable || !onDirectionChange) return;
    const rect = compassRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Use same transform as getAngleFromEvent for hit test
    const clientX = e.clientX;
    const clientY = e.clientY;
    const scaleX = rect.width / size;
    const scaleY = rect.height / size;
    const localX = (clientX - rect.left) / scaleX;
    const localY = (clientY - rect.top) / scaleY;
    const dx = localX - center;
    const dy = localY - center;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Allow clicks within the compass circle with tolerance for edge precision (including stroke width)
    if (distance <= radius + 3) {
      e.preventDefault();
      dragCleanupRef.current?.();

      const pointerId = e.pointerId;
      dragActiveRef.current = true;
      activePointerIdRef.current = pointerId;
      setDragging(true);
      const ang = getAngleFromEvent(e);
      setLiveDeg(ang);
      onDirectionChangeRef.current?.(ang);

      const move = (ev: PointerEvent) => {
        if (activePointerIdRef.current !== pointerId || !dragActiveRef.current) {
          return;
        }
        const a = getAngleFromEvent(ev);
        setLiveDeg(a);
        onDirectionChangeRef.current?.(a);
      };

      const up = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        dragCleanupRef.current?.();
      };

      dragCleanupRef.current = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        dragCleanupRef.current = null;
        dragActiveRef.current = false;
        activePointerIdRef.current = null;
        setDragging(false);
        setLiveDeg(null);
        try {
          compassRef.current?.releasePointerCapture(pointerId);
        } catch {
          /* already released */
        }
      };

      // Attach synchronously so the first touchmove (same frame on many phones) is not missed.
      window.addEventListener("pointermove", move, { passive: true });
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);

      if (compassRef.current) {
        compassRef.current.setPointerCapture(pointerId);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    dragCleanupRef.current?.();
  };

  const handlePointerCancel = handlePointerUp;

  // Precompute cardinal/intercardinal label distance
  const labelDistance = radius + 22;
  const degreeTicks: Array<React.ReactNode> = useMemo(() => {
    const ticks: Array<React.ReactNode> = [];
    for (let deg = 0; deg < 360; deg += 15) {
      const isMajor = deg % 90 === 0;
      const isMinor = deg % 45 === 0 && !isMajor;
      const lineLength = isMajor ? 18 : isMinor ? 12 : 8;
      const strokeWidth = isMajor ? 4 : isMinor ? 3 : 2;
      const rad = ((deg - 90) * Math.PI) / 180;
      // Use toFixed to stabilize hydration attributes
      const x1 = (center + Math.cos(rad) * (radius - lineLength)).toFixed(4);
      const y1 = (center + Math.sin(rad) * (radius - lineLength)).toFixed(4);
      const x2 = (center + Math.cos(rad) * radius).toFixed(4);
      const y2 = (center + Math.sin(rad) * radius).toFixed(4);
      ticks.push(
        <line
          key={`tick-${deg}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#000"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{ pointerEvents: "none" }}
        />,
      );
    }
    return ticks;
  }, []);

  return (
    <div
      className="relative z-[1] mx-auto inline-block max-w-full pb-2 text-center max-sm:pb-5 sm:pb-2"
      style={{
        /* Wider box offsets VIEW_PAD so dial size stays close to the original 260px layout */
        width: "min(308px, min(100%, 90vw))",
        maxWidth: 328,
      }}
    >
      <div className="box-border aspect-square w-full max-w-full overflow-visible p-1">
        <svg
          ref={compassRef}
          viewBox={viewBoxStr}
          preserveAspectRatio="xMidYMid meet"
          className="block h-full w-full max-w-full overflow-visible"
          style={{
            // Read-only compasses must allow panning so the page can scroll when swiping over them.
            // Manipulatable compasses need touch-action:none so the browser does not claim pan gestures
            // before pointer events (pan-x pan-y breaks drag on many mobile browsers).
            touchAction: manipulatable ? "none" : "auto",
            cursor: "default",
            filter: dragging ? "brightness(0.9)" : "none",
            transition: "filter 120ms ease",
            textRendering: "geometricPrecision",
          }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          {/* Compass Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="#fff"
            stroke="var(--foreground,#222)"
            strokeWidth="2"
          />

          {/* Degree ticks */}
          {degreeTicks}

          {/* Interactive area with circular cursor - only for manipulatable compasses (placed after ticks to be on top) */}
          {manipulatable && (
            <circle
              cx={center}
              cy={center}
              r={radius + 3}
              fill="transparent"
              style={{
                cursor: dragging ? "grabbing" : "pointer",
                pointerEvents: "all",
              }}
            />
          )}

          {/* Cardinal & Intercardinal Labels (replace degree numbers) */}
          {cardinalPoints.map((c) => {
            const rad = ((c.angle - 90) * Math.PI) / 180;
            const x = center + Math.cos(rad) * labelDistance;
            const y = center + Math.sin(rad) * labelDistance;
            return (
              <text
                key={c.label}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--foreground, #222)"
                fontWeight={900}
                fontSize="16"
                style={{
                  textShadow: "0 1px 6px #fff8, 0 0 2px #fff5",
                  letterSpacing: "0.04em",
                }}
              >
                {c.label}
              </text>
            );
          })}

          {/* Direction Arrow — SVG rotate(cx,cy) avoids CSS px/origin bugs at page zoom / DPR */}
          <g
            transform={`rotate(${direction} ${center} ${center})`}
            style={{
              cursor: manipulatable ? (dragging ? "grabbing" : "pointer") : "default",
            }}
          >
            {arrowInward ? (
              <>
                <line
                  x1={center}
                  y1={center - radius + arrowRimInset + 6}
                  x2={center}
                  y2={center - 22}
                  stroke="var(--accent, #2367b5)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <polygon
                  points={`${center - 10},${center - 22} ${center + 10},${center - 22} ${center},${center}`}
                  fill="var(--accent, #2367b5)"
                />
              </>
            ) : (
              <>
                <line
                  x1={center}
                  y1={center - radius + arrowRimInset + 22}
                  x2={center}
                  y2={center - radius + arrowRimInset + 22 + 68}
                  stroke="var(--accent, #2367b5)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <polygon
                  points={`
                  ${center - 10},${center - radius + arrowRimInset + 22}
                  ${center + 10},${center - radius + arrowRimInset + 22}
                  ${center},${center - radius + arrowRimInset}
                `}
                  fill="var(--accent, #2367b5)"
                />
              </>
            )}
          </g>

          {/* Live degree readout while dragging */}
          {dragging && (
            <text
              x={center}
              y={center}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#111"
              fontWeight={800}
              fontSize="22"
              style={{ textShadow: "0 1px 4px #fff8" }}
            >
              {liveDeg !== null ? liveDeg.toFixed(0) + "°" : ""}
            </text>
          )}
        </svg>
      </div>
      <div className="mt-0.5 font-bold max-sm:mt-1">{label}</div>
      <div
        className="mt-0.5 max-w-full px-0.5 text-base opacity-80 max-sm:mt-1 max-sm:pb-0 sm:mb-1"
        style={{ wordBreak: "break-word" }}
      >
        {arrowInward
          ? `Blowing from: ${direction.toFixed(0)}°`
          : `User facing: ${direction.toFixed(0)}°`}
      </div>
    </div>
  );
};

export default Compass;
