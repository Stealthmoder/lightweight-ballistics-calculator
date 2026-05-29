import { describe, expect, it } from "vitest";
import { solveShot, type ShotInput } from "./ballistics";

function buildInput(overrides: Partial<ShotInput> = {}): ShotInput {
  const base: ShotInput = {
    distanceMeters: 400,
    zeroRangeMeters: 100,
    shootingAzimuthDeg: 0,
    rifle: {
      muzzleVelocityMps: 820,
      ballisticCoefficient: 0.5,
      bcModel: "G1",
      twistRateInches: 10,
      bulletWeightGrains: 140,
      latitudeDeg: 40,
      spinDirection: "right",
    },
    env: {
      temperatureC: 15,
      pressureHpa: 1013,
      humidityPercent: 50,
      windSpeedMps: 5,
      windDirectionDeg: 90,
      elevationMeters: 0,
      referenceElevationMeters: 0,
    },
  };
  return {
    ...base,
    ...overrides,
    rifle: { ...base.rifle, ...overrides.rifle },
    env: { ...base.env, ...overrides.env },
  };
}

describe("solveShot", () => {
  it("returns near-zero relative outputs at the zero range", () => {
    const input = buildInput({ distanceMeters: 100, zeroRangeMeters: 100 });
    const s = solveShot(input);
    expect(s.dropMeters).toBeCloseTo(0, 8);
    expect(s.windDriftMeters).toBeCloseTo(0, 8);
    expect(s.coriolisMeters).toBeCloseTo(0, 8);
    expect(s.spinDriftMeters).toBeCloseTo(0, 8);
  });

  it("produces opposite wind drift signs for opposite crosswind directions", () => {
    const fromEast = solveShot(
      buildInput({
        env: { windSpeedMps: 8, windDirectionDeg: 90 },
      }),
    );
    const fromWest = solveShot(
      buildInput({
        env: { windSpeedMps: 8, windDirectionDeg: 270 },
      }),
    );
    expect(fromEast.windDriftMeters).toBeCloseTo(-fromWest.windDriftMeters, 8);
  });

  it("flips spin drift sign when rifling direction flips", () => {
    const rightTwist = solveShot(
      buildInput({ rifle: { spinDirection: "right" } }),
    );
    const leftTwist = solveShot(
      buildInput({ rifle: { spinDirection: "left" } }),
    );
    expect(rightTwist.spinDriftMeters).toBeCloseTo(
      -leftTwist.spinDriftMeters,
      8,
    );
  });

  it("increases time of flight and reduces velocity at longer distance", () => {
    const shortRange = solveShot(buildInput({ distanceMeters: 300 }));
    const longRange = solveShot(buildInput({ distanceMeters: 700 }));
    expect(longRange.timeOfFlightS).toBeGreaterThan(shortRange.timeOfFlightS);
    expect(longRange.remainingVelocityMps).toBeLessThan(
      shortRange.remainingVelocityMps,
    );
  });
});
