import { ArrowDown, ArrowUp, MapPin, Thermometer } from "lucide-react";
import WeatherIcon from "./WeatherIcon.jsx";
import { NO_VALUE, formatCoordinates, formatTemp, formatTime } from "../../utils/format.js";

function MainWeatherCard({ location, current, units }) {
  const place = location.name ?? NO_VALUE;

  // "Region, Country" for searched places. For "Current location" there is no
  // place name available, so show the coordinates instead.
  const regionAndCountry = [location.region, location.country].filter(Boolean).join(", ");
  const subtitle = regionAndCountry || formatCoordinates(location.latitude, location.longitude);

  return (
    <section id="overview" className="hero area-hero" aria-labelledby="overview-title">
      <div className="hero-location-row">
        <MapPin size={20} aria-hidden="true" />
        <h2 id="overview-title" className="hero-location">
          {place}
        </h2>
      </div>
      <p className="hero-country">{subtitle}</p>

      <div className="hero-main">
        <p className="hero-temp">{formatTemp(current.temperature, units)}</p>
        <WeatherIcon name={current.icon} size={88} className="hero-icon" />
      </div>

      <p className="hero-condition">{current.condition ?? NO_VALUE}</p>

      <ul className="hero-meta">
        <li className="hero-chip">
          <Thermometer size={16} aria-hidden="true" />
          Feels like {formatTemp(current.feelsLike, units)}
        </li>
        <li className="hero-chip">
          <ArrowUp size={16} aria-hidden="true" />
          High {formatTemp(current.high, units)}
        </li>
        <li className="hero-chip">
          <ArrowDown size={16} aria-hidden="true" />
          Low {formatTemp(current.low, units)}
        </li>
      </ul>

      <p className="hero-updated">Updated {formatTime(current.observedAt, location.timezone)}</p>
    </section>
  );
}

export default MainWeatherCard;