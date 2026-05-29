import { useEffect, useState } from "react";

type NumericRowProps = {
  label: string;
  v: number;
  set: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
};

export function NumericRow({ label, v, set, step, min, max }: NumericRowProps) {
  const [localValue, setLocalValue] = useState<string>(
    Number.isFinite(v) ? String(v) : "",
  );

  useEffect(() => {
    setLocalValue(Number.isFinite(v) ? String(v) : "");
  }, [v]);

  const commitValue = () => {
    if (localValue === "") return;
    const parsed = Number(localValue);
    if (!Number.isFinite(parsed)) return;
    let clamped = parsed;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);
    set(clamped);
    setLocalValue(String(clamped));
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full min-w-0">
      <label className="w-full sm:w-44 text-base text-center shrink-0">
        {label}
      </label>
      <input
        className="input-compact border rounded text-base shrink-0"
        type="number"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={commitValue}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitValue();
        }}
        step={step}
        min={min}
        max={max}
      />
    </div>
  );
}

