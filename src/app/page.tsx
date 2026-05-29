"use client";

import { useEffect, useState } from "react";
import { units, type UnitSystem } from "@/lib/units";
import type { BallisticInputs } from "@/types/inputs";
import { useDeviceHeading } from "@/hooks/useDeviceHeading";
import { useTrajectoryData } from "@/hooks/useTrajectoryData";
import { useWeather } from "@/hooks/useWeather";
import Compass from "@/components/Compass";
import TrajectoryChart from "@/components/trajectory/TrajectoryChart";
import { NumericRow } from "@/components/controls/NumericRow";
import { PaletteSwitcher } from "@/components/controls/PaletteSwitcher";
import { WeatherUpdateControls } from "@/components/controls/WeatherUpdateControls";
import { WeatherSummary } from "@/components/weather/WeatherSummary";

export default function Home() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
  const [inputs, setInputs] = useState<BallisticInputs>({
    bulletWeightGrains: 140,
    muzzleVelocityMps: 820,
    ballisticCoefficient: 0.5,
    bcModel: "G1",
    twistInches: 10,
    spinDirection: "right",
    elevationM: 0,
    zeroRangeM: units.ydToM(100),
    facingDeg: 0,
    latitudeDeg: 40,
  });
  const {
    userDirection,
    setUserDirection,
    deviceHeading,
    resetUserDirection,
  } = useDeviceHeading(inputs.facingDeg);
  const weatherState = useWeather({
    onLatitudeUpdate: (lat) => setInputs((p) => ({ ...p, latitudeDeg: lat })),
  });
  const trajectoryChartData = useTrajectoryData(
    weatherState.weather,
    inputs,
    unitSystem,
  );

  // Keep solver input facing direction in sync with compass interaction.
  useEffect(() => {
    setInputs((p) => ({ ...p, facingDeg: userDirection }));
  }, [userDirection]);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-start pt-4 pb-5 sm:pt-6 sm:pb-6 px-2"
      style={{ background: "var(--background)" }}
    >
      <header className="mb-5 sm:mb-6 w-full max-w-6xl px-2 flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-x-3">
        <span className="hidden sm:block min-w-0" aria-hidden="true" />
        <h1
          className="min-w-0 px-1 text-center text-2xl sm:text-3xl font-bold tracking-tight drop-shadow-lg"
          style={{ color: "var(--foreground)" }}
        >
          Lightweight Ballistics Calculator
        </h1>
        <div className="flex justify-center sm:justify-end min-w-0">
          <PaletteSwitcher />
        </div>
      </header>

      {/* Refresh Page Button */}
      <div className="w-full max-w-6xl flex flex-col items-center gap-2 mb-4 sm:mb-5">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-foreground)] font-medium transition-colors"
        >
          Refresh Page
        </button>
        <p
          className="text-sm text-center opacity-75"
          style={{ color: "var(--foreground)" }}
        >
          Refresh periodically to update weather data and location
        </p>
      </div>

      <WeatherUpdateControls
        autoUpdateWeather={weatherState.autoUpdateWeather}
        setAutoUpdateWeather={weatherState.setAutoUpdateWeather}
        useCustomInterval={weatherState.useCustomInterval}
        setUseCustomInterval={weatherState.setUseCustomInterval}
        weatherUpdateInterval={weatherState.weatherUpdateInterval}
        setWeatherUpdateInterval={weatherState.setWeatherUpdateInterval}
        customIntervalSeconds={weatherState.customIntervalSeconds}
        setCustomIntervalSeconds={weatherState.setCustomIntervalSeconds}
        fetchWeather={weatherState.fetchWeather}
      />

      {/* Compasses Row */}
      <div className="w-full max-w-6xl flex justify-center mb-12 sm:mb-6 px-2 sm:px-4 min-w-0 sm:overflow-x-auto sm:overscroll-x-contain">
        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-10 md:gap-14 relative w-full min-w-0 max-w-full justify-center">
          <Compass
            direction={weatherState.weather ? weatherState.weather.windDeg : 0}
            label="Wind Direction"
            arrowInward
          />
          <div className="flex flex-col justify-center items-center w-full sm:w-auto mt-4 mb-2 sm:mt-0 sm:mb-0">
            <button
              onClick={resetUserDirection}
              disabled={deviceHeading === null}
              className="my-3 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-foreground)] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg w-full sm:w-auto"
              title="Reset to device orientation"
            >
              Reset
            </button>
          </div>
          <Compass
            direction={userDirection}
            label="Your Direction"
            manipulatable
            onDirectionChange={setUserDirection}
          />
        </div>
      </div>

      <div className="w-full max-w-7xl flex justify-center px-2 min-w-0">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-stretch justify-items-stretch min-w-0">
          <form
            className="glass-card p-6 sm:p-8 space-y-6 flex flex-col items-center w-full min-w-0"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              <span
                className="text-base font-medium opacity-90"
                style={{ color: "var(--foreground)" }}
              >
                Units
              </span>
              <div className="flex flex-wrap items-center justify-center gap-6">
                <label className="text-base flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="units"
                    checked={unitSystem === "imperial"}
                    onChange={() => setUnitSystem("imperial")}
                    className="accent-accent"
                  />{" "}
                  Imperial
                </label>
                <label className="text-base flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="units"
                    checked={unitSystem === "metric"}
                    onChange={() => setUnitSystem("metric")}
                    className="accent-accent"
                  />{" "}
                  Metric
                </label>
              </div>
            </div>

            <fieldset className="border border-accent-40 rounded-xl p-5 sm:p-6 bg-white/5 backdrop-blur-sm w-full min-w-0">
              <div className="flex flex-col gap-0 items-center w-full min-w-0">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full min-w-0">
                  <label className="w-full sm:w-44 text-base shrink-0 text-center">
                    BC Model
                  </label>
                  <select
                    className="input-compact border rounded text-base shrink-0"
                    value={inputs.bcModel}
                    onChange={(e) => {
                      const next = e.target.value === "G7" ? "G7" : "G1";
                      setInputs((p) => ({ ...p, bcModel: next }));
                    }}
                  >
                    <option value="G1">G1</option>
                    <option value="G7">G7</option>
                  </select>
                </div>
                <NumericRow
                  label="BC"
                  v={inputs.ballisticCoefficient}
                  set={(v) =>
                    setInputs((p) => ({ ...p, ballisticCoefficient: v }))
                  }
                  step={0.01}
                  min={0.1}
                />
                <NumericRow
                  label="Bullet Weight (gr)"
                  v={inputs.bulletWeightGrains}
                  set={(v) =>
                    setInputs((p) => ({ ...p, bulletWeightGrains: v }))
                  }
                  step={1}
                  min={30}
                />
                <NumericRow
                  label={
                    unitSystem === "metric"
                      ? "Muzzle Velocity (m/s)"
                      : "Muzzle Velocity (fps)"
                  }
                  v={
                    unitSystem === "metric"
                      ? inputs.muzzleVelocityMps
                      : Math.round(units.mpsToFps(inputs.muzzleVelocityMps))
                  }
                  set={(v) =>
                    setInputs((p) => ({
                      ...p,
                      muzzleVelocityMps:
                        unitSystem === "metric" ? v : units.fpsToMps(v),
                    }))
                  }
                  step={unitSystem === "metric" ? 5 : 10}
                  min={100}
                />
                <NumericRow
                  label={
                    unitSystem === "metric"
                      ? "Zero Distance (m)"
                      : "Zero Distance (yd)"
                  }
                  v={
                    unitSystem === "metric"
                      ? inputs.zeroRangeM
                      : Math.round(units.mToYd(inputs.zeroRangeM))
                  }
                  set={(v) =>
                    setInputs((p) => ({
                      ...p,
                      zeroRangeM: unitSystem === "metric" ? v : units.ydToM(v),
                    }))
                  }
                  step={unitSystem === "metric" ? 1 : 1}
                  min={10}
                />
                <NumericRow
                  label={
                    unitSystem === "metric" ? "Elevation (m)" : "Elevation (ft)"
                  }
                  v={
                    unitSystem === "metric"
                      ? inputs.elevationM
                      : Math.round(units.mToFt(inputs.elevationM))
                  }
                  set={(v) =>
                    setInputs((p) => ({
                      ...p,
                      elevationM: unitSystem === "metric" ? v : units.ftToM(v),
                    }))
                  }
                  step={unitSystem === "metric" ? 1 : 5}
                />
                <NumericRow
                  label="Facing (°)"
                  v={inputs.facingDeg}
                  set={(v) =>
                    setInputs((p) => ({
                      ...p,
                      facingDeg: Math.max(0, Math.min(359, v)),
                    }))
                  }
                  step={1}
                  min={0}
                  max={359}
                />

                <div
                  className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 border-t pt-3 text-base w-full justify-items-center"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--foreground) 14%, transparent)",
                  }}
                >
                  <WeatherSummary
                    wind={
                      weatherState.weather
                        ? `${unitSystem === "metric" ? `${weatherState.weather.windMps.toFixed(1)} m/s` : `${units.mpsToMph(weatherState.weather.windMps).toFixed(1)} mph`} @ ${weatherState.weather.windDeg.toFixed(0)}°`
                        : "—"
                    }
                    elevation={
                      weatherState.weather
                        ? unitSystem === "metric"
                          ? `${Math.round(weatherState.weather.elevM)} m`
                          : `${Math.round(units.mToFt(weatherState.weather.elevM))} ft`
                        : "—"
                    }
                    temperature={
                      weatherState.weather
                        ? unitSystem === "metric"
                          ? `${weatherState.weather.tempC.toFixed(1)} °C`
                          : `${units.cToF(weatherState.weather.tempC).toFixed(1)} °F`
                        : "—"
                    }
                    pressure={
                      weatherState.weather
                        ? unitSystem === "metric"
                          ? `${weatherState.weather.hpa.toFixed(0)} hPa`
                          : `${units.hPaToInHg(weatherState.weather.hpa).toFixed(2)} inHg`
                        : "—"
                    }
                  />
                </div>
              </div>
            </fieldset>
          </form>
          <section className="glass-card p-6 sm:p-8 flex flex-col items-stretch text-base h-full w-full min-w-0">
            <div className="w-full flex-1 rounded-xl bg-black/40 p-3 shadow-inner flex flex-col min-h-[260px] sm:min-h-[320px] min-w-0">
              <div className="w-full overflow-x-auto overflow-y-auto md:overflow-x-hidden min-w-0">
                <TrajectoryChart
                  data={trajectoryChartData}
                  unitSystem={unitSystem}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
