export type UnitSystem = "metric" | "imperial";

export const units = {
  mToYd: (m: number) => m * 1.0936133,
  ydToM: (yd: number) => yd / 1.0936133,
  mpsToFps: (mps: number) => mps * 3.28084,
  fpsToMps: (fps: number) => fps / 3.28084,
  cToF: (c: number) => (c * 9) / 5 + 32,
  fToC: (f: number) => ((f - 32) * 5) / 9,
  hPaToInHg: (hpa: number) => hpa * 0.0295299830714,
  inHgToHpa: (inHg: number) => inHg * 33.8639,
  mToFt: (m: number) => m * 3.28084,
  ftToM: (ft: number) => ft / 3.28084,
  mpsToMph: (mps: number) => mps * 2.23693629,
  mphToMps: (mph: number) => mph / 2.23693629,
};
