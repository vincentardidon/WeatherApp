import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  Wind,
} from "lucide-react";

// Maps the icon keys sent by the backend (backend/src/utils/weatherCodes.js)
// to Lucide icons.
const ICONS = {
  clear: Sun,
  "clear-night": Moon,
  "partly-cloudy": CloudSun,
  "partly-cloudy-night": CloudMoon,
  cloudy: Cloud,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  thunderstorm: CloudLightning,
  snow: CloudSnow,
  fog: CloudFog,
  wind: Wind,
};

function WeatherIcon({ name, size = 24, className = "" }) {
  const Icon = ICONS[name];
  const Component = Icon ?? Cloud;
  const emptyClass = Icon ? "" : "weather-icon--empty";

  return (
    <Component
      size={size}
      strokeWidth={1.5}
      className={`${className} ${emptyClass}`.trim()}
      aria-hidden="true"
    />
  );
}

export default WeatherIcon;