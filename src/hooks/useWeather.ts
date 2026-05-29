import { useCallback, useEffect, useRef, useState } from "react";
import { getWeatherForLatLon } from "@/lib/weather";
import type { WeatherSnapshot } from "@/types/weather";

type UseWeatherOptions = {
  onLatitudeUpdate?: (lat: number) => void;
};

export function useWeather({ onLatitudeUpdate }: UseWeatherOptions = {}) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [autoUpdateWeather, setAutoUpdateWeather] = useState(true);
  const [weatherUpdateInterval, setWeatherUpdateInterval] = useState(30);
  const [useCustomInterval, setUseCustomInterval] = useState(false);
  const [customIntervalSeconds, setCustomIntervalSeconds] = useState(30);

  const fetchInFlight = useRef(false);

  const fetchWeather = useCallback(async () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not available");
      return;
    }
    if (fetchInFlight.current) return;
    fetchInFlight.current = true;

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (err) => {
            reject(
              new Error(
                `Geolocation error: ${err.message || "Permission denied or location unavailable"}`,
              ),
            );
          },
          { timeout: 10000, enableHighAccuracy: false },
        );
      });
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      onLatitudeUpdate?.(lat);

      const w = await getWeatherForLatLon(lat, lon);
      setWeather({
        tempC: w.temperatureC,
        hpa: w.pressureHpa,
        windMps: w.windSpeedMps,
        windDeg: w.windDirectionDeg,
        elevM: w.elevationMeters,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : String(error) || "Unknown error";
      const rateLimited =
        error instanceof Error && /\b429\b/.test(errorMessage);
      if (rateLimited) {
        console.warn(
          "Weather temporarily rate-limited; will retry on the next update.",
        );
      } else {
        console.error("Failed to fetch weather:", errorMessage, error);
      }
    } finally {
      fetchInFlight.current = false;
    }
  }, [onLatitudeUpdate]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const actualIntervalSeconds = useCustomInterval
    ? Math.max(5, Math.min(300, customIntervalSeconds))
    : weatherUpdateInterval;

  useEffect(() => {
    if (!autoUpdateWeather) return;
    const intervalMs = actualIntervalSeconds * 1000;
    const intervalId = setInterval(() => {
      fetchWeather();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [autoUpdateWeather, actualIntervalSeconds, fetchWeather]);

  return {
    weather,
    fetchWeather,
    autoUpdateWeather,
    setAutoUpdateWeather,
    weatherUpdateInterval,
    setWeatherUpdateInterval,
    useCustomInterval,
    setUseCustomInterval,
    customIntervalSeconds,
    setCustomIntervalSeconds,
  };
}
