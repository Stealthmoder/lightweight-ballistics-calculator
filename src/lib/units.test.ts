import { describe, expect, it } from "vitest";
import { units } from "./units";

describe("units", () => {
  it("converts mph <-> mps consistently", () => {
    const mph = 10;
    const mps = units.mphToMps(mph);
    expect(units.mpsToMph(mps)).toBeCloseTo(mph, 8);
  });

  it("converts Fahrenheit <-> Celsius consistently", () => {
    const c = 21;
    const f = units.cToF(c);
    expect(units.fToC(f)).toBeCloseTo(c, 8);
  });

  it("converts inHg <-> hPa consistently", () => {
    const hpa = 1013.25;
    const inHg = units.hPaToInHg(hpa);
    expect(units.inHgToHpa(inHg)).toBeCloseTo(hpa, 3);
  });
});
