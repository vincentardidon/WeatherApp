import { describeWeather, formatDate, formatTemperature } from "../utils/weather.js";
import WeatherIcon from "./WeatherIcon.jsx";

export default function ForecastCard({ day, unit, index }) {
  const dayName = index === 0 ? "Today" : formatDate(day.date, { weekday: "short" });

  return (
    <article className="forecast-day">
      <div className="forecast-day-date">
        <strong>{dayName}</strong>
        <span>{formatDate(day.date, { month: "short", day: "numeric" })}</span>
      </div>
      <WeatherIcon code={day.weatherCode} size={28} className="forecast-icon" />
      <span className="forecast-condition">{describeWeather(day.weatherCode)}</span>
      <div className="forecast-temperatures" aria-label={`High ${formatTemperature(day.high, unit)}, low ${formatTemperature(day.low, unit)}`}>
        <strong>{formatTemperature(day.high, unit)}</strong>
        <span>{formatTemperature(day.low, unit)}</span>
      </div>
    </article>
  );
}
