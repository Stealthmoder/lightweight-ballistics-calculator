export type WeatherData = {
  temperatureC: number;
  humidityPercent: number;
  pressureHpa: number;
  windSpeedMps: number;
  windDirectionDeg: number;
  elevationMeters: number;
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function retryAfterDelayMs(res: Response, attemptIndex: number): number {
  const raw = res.headers.get("Retry-After");
  if (raw) {
    const sec = Number(raw);
    if (Number.isFinite(sec) && sec >= 0) {
      return Math.min(sec * 1000, 120_000);
    }
    const when = Date.parse(raw);
    if (!Number.isNaN(when)) {
      const ms = when - Date.now();
      if (ms > 0) return Math.min(ms, 120_000);
    }
  }
  return Math.min(1500 * 2 ** attemptIndex, 30_000);
}

async function fetchJson(url: string): Promise<unknown> {
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) return res.json();
    const retryable = res.status === 429 || res.status === 503;
    if (retryable && attempt < maxAttempts - 1) {
      await sleep(retryAfterDelayMs(res, attempt));
      continue;
    }
    throw new Error(`Weather request failed: ${res.status}`);
  }
  throw new Error("Weather request failed: exhausted retries");
}

function isRateLimitedError(err: unknown): boolean {
  return err instanceof Error && /\b429\b/.test(err.message);
}

function parseCurrentWeather(data: Record<string, unknown>): WeatherData {
  const current = (data.current ?? {}) as Record<string, unknown>;
  const elevation = typeof data.elevation === "number" ? data.elevation : 0;
  return {
    temperatureC: Number(current.temperature_2m ?? 15),
    humidityPercent: Number(current.relative_humidity_2m ?? 50),
    pressureHpa: Number(current.pressure_msl ?? 1013),
    windSpeedMps: Number(current.wind_speed_10m ?? 0),
    windDirectionDeg: Number(current.wind_direction_10m ?? 0),
    elevationMeters: elevation,
  };
}

function parseHourlyWeather(data: Record<string, unknown>): WeatherData {
  const idx = 0;
  const hourly = (data.hourly ?? {}) as Record<string, unknown[] | undefined>;
  const elevation = typeof data.elevation === "number" ? data.elevation : 0;
  return {
    temperatureC: Number(hourly.temperature_2m?.[idx] ?? 15),
    humidityPercent: Number(hourly.relative_humidity_2m?.[idx] ?? 50),
    pressureHpa: Number(hourly.pressure_msl?.[idx] ?? 1013),
    windSpeedMps: Number(hourly.wind_speed_10m?.[idx] ?? 0),
    windDirectionDeg: Number(hourly.wind_direction_10m?.[idx] ?? 0),
    elevationMeters: elevation,
  };
}

export async function getWeatherForLatLon(
  lat: number,
  lon: number,
): Promise<WeatherData> {
  const baseParams = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,pressure_msl",
    wind_speed_unit: "ms",
    timezone: "auto",
  });
  const url = `https://api.open-meteo.com/v1/forecast?${baseParams.toString()}`;
  try {
    const data = (await fetchJson(url)) as Record<string, unknown>;
    return parseCurrentWeather(data);
  } catch (err) {
    if (isRateLimitedError(err)) {
      throw err;
    }
    console.error("Weather API fetch failed:", err);
    const fallbackParams = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      hourly:
        "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,pressure_msl",
      wind_speed_unit: "ms",
      timezone: "auto",
    });
    const fallbackUrl = `https://api.open-meteo.com/v1/forecast?${fallbackParams.toString()}`;
    const data = (await fetchJson(fallbackUrl)) as Record<string, unknown>;
    return parseHourlyWeather(data);
  }
}
