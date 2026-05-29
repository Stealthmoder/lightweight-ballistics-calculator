// Lightweight point-mass ballistics utilities.

export type RifleInput = {
  muzzleVelocityMps: number; // derived from barrel, caliber, load (approx)
  ballisticCoefficient: number; // dimensionless (approx)
  bcModel: "G1" | "G7";
  twistRateInches: number; // inches per turn
  bulletWeightGrains: number;
  latitudeDeg: number; // for Coriolis
  spinDirection: "right" | "left"; // rifling
};

export type EnvironmentInput = {
  temperatureC: number;
  pressureHpa: number;
  humidityPercent: number;
  windSpeedMps: number;
  windDirectionDeg: number; // coming-from direction, 0 = from North
  elevationMeters: number;
  referenceElevationMeters: number;
};

export type ShotInput = {
  distanceMeters: number;
  zeroRangeMeters: number; // where the rifle is zeroed; outputs are relative to this range
  rifle: RifleInput;
  env: EnvironmentInput;
  shootingAzimuthDeg: number; // direction shooter is facing; 0=North, 90=East
};

export type ShotSolution = {
  timeOfFlightS: number;
  dropMeters: number;
  dropMil: number;
  windDriftMeters: number;
  windDriftMil: number;
  coriolisMeters: number;
  coriolisMil: number;
  spinDriftMeters: number;
  spinDriftMil: number;
  remainingVelocityMps: number;
};

const GRAVITY = 9.80665; // m/s^2
const DEG2RAD = Math.PI / 180;

/** BC values are typically quoted for a nominal bullet weight; scale BC when weight differs. */
const BC_REFERENCE_BULLET_GRAINS = 140;

// Very rough air density estimate via International Standard Atmosphere adjusted by pressure and temperature
function estimateAirDensity(
  pressureHpa: number,
  temperatureC: number,
  humidityPercent: number,
): number {
  const P = pressureHpa * 100; // Pa
  const T = temperatureC + 273.15; // K
  // Ignore humidity in first version; optionally reduce density slightly with humidity
  const dryAirR = 287.05; // J/(kg·K)
  const rho = P / (dryAirR * T);
  const humidityFactor = 1 - 0.003 * (humidityPercent / 100); // small reduction
  return rho * humidityFactor;
}

// Very rough drag deceleration using a pseudo BC model: a = k * v^2 / BC
// headwindMps: positive = wind from front (increases airspeed, more drag)
function integrateVelocity(
  distanceM: number,
  muzzleVelocityMps: number,
  ballisticCoefficient: number,
  bulletWeightGrains: number,
  bcModel: RifleInput["bcModel"],
  airDensity: number,
  headwindMps = 0,
): { time: number; v: number } {
  // numeric integration in small steps
  const steps = Math.max(50, Math.floor(distanceM / 5));
  const dx = distanceM / steps;
  let v = muzzleVelocityMps;
  let t = 0;
  // Very rough drag model:
  // dv/dx ~= -(k_model / BC) * vAir
  // where k_model is scaled for the chosen G1 vs G7 reference model.
  const bcModelDragFactor = bcModel === "G7" ? 0.62 : 1.0;
  const k = 0.0004 * (airDensity / 1.225) * bcModelDragFactor;
  const weightFactor = Math.max(
    0.15,
    bulletWeightGrains / BC_REFERENCE_BULLET_GRAINS,
  );
  const effectiveBc = ballisticCoefficient * weightFactor;
  const minAirspeed = 10;
  for (let i = 0; i < steps; i++) {
    // Airspeed for drag: headwind increases relative speed through air
    const vAir = Math.max(minAirspeed, v + headwindMps);
    // dv/dx = -(k/BC) * vAir  → drag based on airspeed
    const dv = -(k / Math.max(0.05, effectiveBc)) * vAir * dx;
    const vNext = Math.max(50, v + dv);
    // time dt = dx / v_avg (ground speed for distance/time)
    const vAvg = (v + vNext) / 2;
    const dt = dx / vAvg;
    t += dt;
    v = vNext;
  }
  return { time: t, v };
}

export function solveShot(input: ShotInput): ShotSolution {
  const { distanceMeters, zeroRangeMeters, rifle, env } = input;
  // Adjust pressure for user altitude relative to the weather-provided elevation.
  // This lets the manual elevation input have a noticeable effect even when we
  // already have weather pressure at the reference elevation.
  const scaleHeightM = 8434; // approximate atmospheric scale height at mid-latitudes
  const adjustedPressureHpa =
    env.pressureHpa *
    Math.exp(-(env.elevationMeters - env.referenceElevationMeters) / scaleHeightM);
  const airRho = estimateAirDensity(
    adjustedPressureHpa,
    env.temperatureC,
    env.humidityPercent,
  );

  // Wind components relative to shooter's facing. Wind direction is coming-from bearing.
  const relativeWindFromDeg = env.windDirectionDeg - input.shootingAzimuthDeg;
  // Positive = headwind (wind from in front of shooter), negative = tailwind.
  const headwindMps =
    env.windSpeedMps * Math.cos(relativeWindFromDeg * DEG2RAD);
  const crosswindMps =
    env.windSpeedMps * Math.sin(relativeWindFromDeg * DEG2RAD);

  const { time: timeTarget, v: vTarget } = integrateVelocity(
    distanceMeters,
    rifle.muzzleVelocityMps,
    rifle.ballisticCoefficient,
    rifle.bulletWeightGrains,
    rifle.bcModel,
    airRho,
    headwindMps,
  );

  const { time: timeZero } = integrateVelocity(
    zeroRangeMeters,
    rifle.muzzleVelocityMps,
    rifle.ballisticCoefficient,
    rifle.bulletWeightGrains,
    rifle.bcModel,
    airRho,
    headwindMps,
  );

  // Outputs are relative to the chosen zero range: at `zeroRangeMeters`, drop/wind/coriolis/spin are 0.

  // Gravity drop without aerodynamic lift: y = 0.5 * g * t^2.
  const dropMeters =
    0.5 * GRAVITY * timeTarget * timeTarget -
    0.5 * GRAVITY * timeZero * timeZero;

  // Wind drift: lateral displacement ~ wind_cross * TOF (scaled by form factor)
  // Relative to zero means subtract drift at the zero distance.
  const windDriftMeters =
    crosswindMps * timeTarget * 0.9 - crosswindMps * timeZero * 0.9;

  // Coriolis: lateral deflection approx omega * v0 * sin(lat) * t^2 (using muzzle velocity as v0 in this simplified model)
  const omega = 7.2921159e-5; // rad/s
  const coriolisMeters =
    omega *
      rifle.muzzleVelocityMps *
      Math.sin(rifle.latitudeDeg * DEG2RAD) *
      timeTarget *
      timeTarget -
    (omega *
      rifle.muzzleVelocityMps *
      Math.sin(rifle.latitudeDeg * DEG2RAD) *
      timeZero *
      timeZero);

  // Spin drift (very rough) proportional to distance relative to zero.
  const twistMetersPerTurn = rifle.twistRateInches * 0.0254;
  const spinRateRps =
    rifle.muzzleVelocityMps / twistMetersPerTurn / (2 * Math.PI);
  const spinFactor = Math.log(1 + Math.max(0, spinRateRps)) * 1e-4;
  const spinSign = rifle.spinDirection === "right" ? 1 : -1;
  const spinDriftMeters = spinSign * spinFactor * (distanceMeters - zeroRangeMeters);

  // MIL conversions at target range: 1 mil = 1/1000 of distance
  const milScale = distanceMeters / 1000;
  const dropMil = dropMeters / milScale;
  const windDriftMil = windDriftMeters / milScale;
  const coriolisMil = coriolisMeters / milScale;
  const spinDriftMil = spinDriftMeters / milScale;

  return {
    timeOfFlightS: timeTarget,
    dropMeters,
    dropMil,
    windDriftMeters,
    windDriftMil,
    coriolisMeters,
    coriolisMil,
    spinDriftMeters,
    spinDriftMil,
    remainingVelocityMps: vTarget,
  };
}
