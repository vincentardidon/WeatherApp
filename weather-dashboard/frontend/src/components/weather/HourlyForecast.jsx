import { Clock, Droplets } from "lucide-react";
import Card from "../ui/Card.jsx";
import WeatherIcon from "./WeatherIcon.jsx";
import { formatHourLabel, formatPercent, formatTemp } from "../../utils/format.js";

function HourlyForecast({ hourly, timezone, units }) {
  return (
    <Card id="hourly" title="Hourly forecast" icon={Clock} className="area-hourly">
      <div className="hourly-scroll" role="region" aria-label="Hourly forecast, scrollable" tabIndex={0}>
        <ul className="hourly-list">
          {hourly.map((hour, index) => (
            <li
              key={hour.time ?? index}
              className={`hourly-item ${index === 0 && hour.time ? "is-now" : ""}`}
            >
              <span className="hourly-time">{formatHourLabel(hour.time, timezone, index)}</span>
              <WeatherIcon name={hour.icon} size={28} />
              <span className="hourly-temp">{formatTemp(hour.temperature, units)}</span>
              <span className="hourly-precip">
                <Droplets size={12} aria-hidden="true" />
                {formatPercent(hour.precipitationChance)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export default HourlyForecast;