import type { RifleInput } from "@/lib/ballistics";

export type BallisticInputs = {
  bulletWeightGrains: number;
  muzzleVelocityMps: number;
  ballisticCoefficient: number;
  bcModel: "G1" | "G7";
  twistInches: number;
  spinDirection: RifleInput["spinDirection"];
  elevationM: number;
  zeroRangeM: number;
  facingDeg: number;
  latitudeDeg: number;
};

