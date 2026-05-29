type WeatherLineProps = { label: string; value: string };

function WeatherLine({ label, value }: WeatherLineProps) {
  return (
    <div className="flex flex-col items-center text-center gap-1 min-w-0 max-w-full">
      <span className="opacity-80 text-base">{label}</span>
      <span
        className="tabular-nums font-medium text-base break-words"
        style={{ color: "var(--foreground)" }}
      >
        {value}
      </span>
    </div>
  );
}

type WeatherSummaryProps = {
  wind: string;
  elevation: string;
  temperature: string;
  pressure: string;
};

export function WeatherSummary({
  wind,
  elevation,
  temperature,
  pressure,
}: WeatherSummaryProps) {
  return (
    <>
      <WeatherLine label="Wind" value={wind} />
      <WeatherLine label="Weather elevation" value={elevation} />
      <WeatherLine label="Temperature" value={temperature} />
      <WeatherLine label="Pressure" value={pressure} />
    </>
  );
}

