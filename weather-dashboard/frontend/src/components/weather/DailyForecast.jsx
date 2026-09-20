import { CalendarDays, Droplets } from "lucide-react";
import Card from "../ui/Card.jsx";
import WeatherIcon from "./WeatherIcon.jsx";
import { formatDayLabel, formatPercent, formatTemp, isNumber } from "../../utils/format.js";

// Position of a day's low-high bar relative to the whole week's range.
function getRangeStyle(day, weekMin, weekMax) {
  if (![day.low, day.high, weekMin, weekMax].every(isNumber)) return undefined;
  const span = weekMax - weekMin || 1;
  return {
    "--start": `${((day.low - weekMin) / span) * 100}%`,
    "--width": `${((day.high - day.low) / span) * 100}%`,
  };
}

function DailyForecast({ daily, units }) {
  const lows = daily.map((day) => day.low).filter(isNumber);
  const highs = daily.map((day) => day.high).filter(isNumber);
  const weekMin = lows.length ? Math.min(...lows) : null;
  const weekMax = highs.length ? Math.max(...highs) : null;

  return (
    <Card id="daily" title="7-day forecast" icon={CalendarDays} className="area-daily">
      <ul className="daily-list">
        {daily.map((day, index) => {
          const rangeStyle = getRangeStyle(day, weekMin, weekMax);
          return (
            <li key={day.date ?? index} className="daily-row">
              <span className="daily-day">
                {formatDayLabel(day.date, index)}
                <span className="daily-precip">
                  <Droplets size={12} aria-hidden="true" />
                  {formatPercent(day.precipitationChance)}
                </span>
              </span>
              <WeatherIcon name={day.icon} size={26} />
              <span className="daily-low">
                <span className="visually-hidden">Low </span>
                {formatTemp(day.low, units)}
              </span>
              <span className="range-bar" aria-hidden="true">
                {rangeStyle && <span className="range-fill" style={rangeStyle} />}
              </span>
              <span className="daily-high">
                <span className="visually-hidden">High </span>
                {formatTemp(day.high, units)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default DailyForecast;