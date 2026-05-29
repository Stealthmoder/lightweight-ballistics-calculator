type WeatherUpdateControlsProps = {
  autoUpdateWeather: boolean;
  setAutoUpdateWeather: (v: boolean) => void;
  useCustomInterval: boolean;
  setUseCustomInterval: (v: boolean) => void;
  weatherUpdateInterval: number;
  setWeatherUpdateInterval: (v: number) => void;
  customIntervalSeconds: number;
  setCustomIntervalSeconds: (v: number) => void;
  fetchWeather: () => void;
};

export function WeatherUpdateControls({
  autoUpdateWeather,
  setAutoUpdateWeather,
  useCustomInterval,
  setUseCustomInterval,
  weatherUpdateInterval,
  setWeatherUpdateInterval,
  customIntervalSeconds,
  setCustomIntervalSeconds,
  fetchWeather,
}: WeatherUpdateControlsProps) {
  return (
    <div className="w-full max-w-6xl mb-4 sm:mb-5 glass-card p-4 rounded-xl min-w-0">
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 flex-wrap min-w-0">
        <label className="flex items-center gap-2 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={autoUpdateWeather}
            onChange={(e) => setAutoUpdateWeather(e.target.checked)}
            className="accent-accent"
          />
          <span className="text-sm font-medium">Auto-update weather</span>
        </label>
        {autoUpdateWeather && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 flex-wrap w-full min-w-0">
            <label className="text-sm font-medium shrink-0 text-center sm:text-left">
              Update interval:
            </label>
            <select
              value={useCustomInterval ? "custom" : weatherUpdateInterval}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setUseCustomInterval(true);
                } else {
                  setUseCustomInterval(false);
                  setWeatherUpdateInterval(Number(e.target.value));
                }
              }}
              className="input-compact border rounded text-sm shrink-0"
            >
              <option value={5}>5 seconds</option>
              <option value={10}>10 seconds</option>
              <option value={15}>15 seconds</option>
              <option value={20}>20 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={45}>45 seconds</option>
              <option value={60}>1 minute</option>
              <option value="custom">Custom</option>
            </select>
            {useCustomInterval && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 flex-wrap min-w-0 w-full sm:w-auto">
                <input
                  type="number"
                  min={5}
                  max={300}
                  step={1}
                  value={customIntervalSeconds}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val)) setCustomIntervalSeconds(val);
                  }}
                  onBlur={(e) => {
                    const val = Number(e.target.value);
                    if (isNaN(val) || val < 5) {
                      setCustomIntervalSeconds(5);
                    } else if (val > 300) {
                      setCustomIntervalSeconds(300);
                    }
                  }}
                  className="input-compact border rounded text-sm shrink-0"
                  placeholder="Seconds"
                />
                <span
                  className="text-sm opacity-75 text-center shrink-0"
                  style={{ color: "var(--foreground)" }}
                >
                  seconds (5-300)
                </span>
              </div>
            )}
          </div>
        )}
        {!autoUpdateWeather && (
          <button
            onClick={fetchWeather}
            className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-foreground)] font-medium transition-colors text-sm"
          >
            Refresh Weather
          </button>
        )}
      </div>
    </div>
  );
}

