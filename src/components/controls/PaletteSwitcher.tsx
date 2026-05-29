import { useEffect, useRef, useState } from "react";

const PALETTE_IDS = [
  "neutral",
  "cosmic-haze",
  "citrus-tide",
  "glacier-blue",
  "oxide-lime",
  "flamingo-sky",
  "tropical-fizz",
] as const;

type PaletteId = (typeof PALETTE_IDS)[number];

const LEGACY_DATA_PALETTE: Record<string, PaletteId> = {
  monochrome: "neutral",
  "blue-purple": "cosmic-haze",
  "teal-orange": "citrus-tide",
  "slate-cyan": "glacier-blue",
  "charcoal-lime": "oxide-lime",
  polychrome: "flamingo-sky",
  polychrome2: "tropical-fizz",
};

function isPaletteId(s: string): s is PaletteId {
  return (PALETTE_IDS as readonly string[]).includes(s);
}

export function PaletteSwitcher() {
  const [palette, setPalette] = useState<string>("neutral");
  const skipPaletteSync = useRef(true);

  // Hydrate palette from any server/legacy body attribute.
  useEffect(() => {
    const raw = document.body.dataset.palette;
    const next = raw
      ? LEGACY_DATA_PALETTE[raw] ?? (isPaletteId(raw) ? raw : "neutral")
      : "neutral";
    setPalette(next);
    document.body.setAttribute("data-palette", next);
  }, []);

  useEffect(() => {
    if (skipPaletteSync.current) {
      skipPaletteSync.current = false;
      return;
    }
    document.body.setAttribute("data-palette", palette);
  }, [palette]);

  return (
    <select
      className="input-compact border rounded text-sm shrink-0 border-[var(--accent-glass)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-[color-mix(in_srgb,var(--foreground)_10%,var(--background))] text-[var(--foreground)] !w-[190px] !max-w-[190px]"
      value={palette}
      onChange={(e) => setPalette(e.target.value)}
      title="Switch color palette"
    >
      <option value="neutral">Monochrome (Default)</option>
      <option value="cosmic-haze">Cosmic Haze</option>
      <option value="citrus-tide">Citrus Tide</option>
      <option value="glacier-blue">Glacier Blue</option>
      <option value="oxide-lime">Oxide Lime</option>
      <option value="flamingo-sky">Flamingo Sky</option>
      <option value="tropical-fizz">Tropical Fizz</option>
    </select>
  );
}

