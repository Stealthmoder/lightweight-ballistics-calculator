import React from "react";
import { units } from "@/lib/units";

interface TrajectoryData {
  distance: number;
  dropMeters: number;
  windDriftMeters: number;
  velocityMps: number;
}

interface TrajectoryChartProps {
  data: TrajectoryData[];
  unitSystem: "metric" | "imperial";
}

export const TrajectoryChart: React.FC<TrajectoryChartProps> = ({
  data,
  unitSystem,
}) => {
  if (data.length === 0) {
    return (
      <div
        className="w-full h-full flex items-center justify-center text-base opacity-60"
        style={{ color: "var(--foreground)" }}
      >
        No data available
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 min-w-0">
      <table className="w-full min-w-[520px] font-mono text-base leading-6 trajectory-table-color">
        <thead>
          <tr
            className="border-b"
            style={{
              borderColor:
                "color-mix(in srgb, var(--foreground) 25%, transparent)",
            }}
          >
            <th className="text-left px-2 sm:px-3 py-2 font-semibold">
              Distance ({unitSystem === "imperial" ? "yd" : "m"})
            </th>
            <th className="text-left px-2 sm:px-3 py-2 font-semibold">Drop</th>
            <th className="text-left px-2 sm:px-3 py-2 font-semibold">
              Wind Drift
            </th>
            <th className="text-left px-2 sm:px-3 py-2 font-semibold">
              Velocity
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const dropValue =
              unitSystem === "metric"
                ? row.dropMeters
                : units.mToFt(row.dropMeters);
            const windValue =
              unitSystem === "metric"
                ? row.windDriftMeters
                : units.mToFt(row.windDriftMeters);
            const dropUnit = unitSystem === "metric" ? "m" : "ft";
            const windUnit = unitSystem === "metric" ? "m" : "ft";

            const dropStr = `${dropValue.toFixed(2)} ${dropUnit}`;
            const windStr = `${windValue.toFixed(2)} ${windUnit}`;
            const velStr =
              unitSystem === "metric"
                ? `${row.velocityMps.toFixed(0)} m/s`
                : `${units.mpsToFps(row.velocityMps).toFixed(0)} fps`;

            const displayDist = row.distance;
            const distanceStr = `${displayDist}`;

            return (
              <tr
                key={i}
                className="border-t"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--foreground) 18%, transparent)",
                }}
              >
                <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                  {distanceStr}
                </td>
                <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                  {dropStr}
                </td>
                <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                  {windStr}
                </td>
                <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                  {velStr}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TrajectoryChart;
