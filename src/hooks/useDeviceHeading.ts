import { useEffect, useState } from "react";

type DeviceOrientationWithCompass = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

export function useDeviceHeading(initialFacingDeg: number) {
  const [userDirection, setUserDirection] = useState(initialFacingDeg);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);

  // Keep direction synced with device sensors when available.
  useEffect(() => {
    if (!window.DeviceOrientationEvent) return;

    const handleOrientation = (e: DeviceOrientationWithCompass) => {
      let deg = 0;
      if (typeof e.webkitCompassHeading === "number") {
        deg = 360 - e.webkitCompassHeading;
      } else if (typeof e.alpha === "number") {
        deg = 360 - e.alpha;
      }
      deg = ((deg % 360) + 360) % 360;
      setDeviceHeading(deg);
      setUserDirection(deg);
    };

    const orientationListener = (event: Event) => {
      handleOrientation(event as DeviceOrientationWithCompass);
    };

    window.addEventListener(
      "deviceorientationabsolute",
      orientationListener,
      true,
    );
    window.addEventListener("deviceorientation", orientationListener, true);

    return () => {
      window.removeEventListener(
        "deviceorientationabsolute",
        orientationListener,
      );
      window.removeEventListener("deviceorientation", orientationListener);
    };
  }, []);

  const resetUserDirection = () => {
    if (deviceHeading !== null) setUserDirection(deviceHeading);
  };

  return { userDirection, setUserDirection, deviceHeading, resetUserDirection };
}

