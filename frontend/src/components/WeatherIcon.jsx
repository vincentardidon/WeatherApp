import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
} from "lucide-react";
import { getWeatherIconName } from "../utils/weather.js";

const icons = {
  sun: Sun,
  "partly-cloudy": CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

export default function WeatherIcon({ code, size = 32, className = "" }) {
  const Icon = icons[getWeatherIconName(code)] ?? Cloud;
  return <Icon aria-hidden="true" className={className} size={size} strokeWidth={1.7} />;
}
