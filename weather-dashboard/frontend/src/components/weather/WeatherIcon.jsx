import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  Wind,
} from "lucide-react";

// Maps our icon keys (see data/emptyWeather.js) to Lucide icons.
const ICONS = {
  clear: Sun,
  "partly-cloudy": CloudSun,
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