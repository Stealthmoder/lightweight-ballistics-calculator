import { useMemo } from "react";
import { solveShot, type EnvironmentInput, type RifleInput } from "@/lib/ballistics";
import { units, type UnitSystem } from "@/lib/units";
import type { BallisticInputs } from "@/types/inputs";
import type { WeatherSnapshot } from "@/types/weather";

export function useTrajectoryData(
  weather: WeatherSnapshot | null,
  inputs: BallisticInputs,
  unitSystem: UnitSystem,
) {
  return useMemo(() => {
    if (!weather) return [];
    const axisSteps = [100, 200, 300, 400, 500, 600, 700, 800];
    return axisSteps.map((axisVal) => {
      const meters = unitSystem === "imperial" ? units.ydToM(axisVal) : axisVal;
      const rifle: RifleInput = {
        muzzleVelocityMps: inputs.muzzleVelocityMps,
        ballisticCoefficient: inputs.ballisticCoefficient,
        bcModel: inputs.bcModel,
        twistRateInches: inputs.twistInches,
        bulletWeightGrains: inputs.bulletWeightGrains,
        latitudeDeg: inputs.latitudeDeg,
        spinDirection: inputs.spinDirection,
      };
      const env: EnvironmentInput = {
        temperatureC: weather.tempC,
        pressureHpa: weather.hpa,
        humidityPercent: 50,
        windSpeedMps: weather.windMps,
        windDirectionDeg: weather.windDeg,
        elevationMeters: inputs.elevationM,
        referenceElevationMeters: weather.elevM,
      };
      const s = solveShot({
        distanceMeters: meters,
        rifle,
        env,
        zeroRangeMeters: inputs.zeroRangeM,
        shootingAzimuthDeg: inputs.facingDeg,
      });
      return {
        distance: axisVal,
        dropMeters: s.dropMeters,
        windDriftMeters: s.windDriftMeters,
        velocityMps: s.remainingVelocityMps,
      };
    });
  }, [weather, inputs, unitSystem]);
}

