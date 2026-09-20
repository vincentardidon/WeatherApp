import { ArrowUp, Compass, Droplets, Eye, Gauge, Sun, Wind } from "lucide-react";
import Card from "../ui/Card.jsx";
import StatTile from "../ui/StatTile.jsx";
import {
  NO_VALUE,
  degreesToCompass,
  describeUv,
  formatDistance,
  formatPercent,
  formatPressure,
  formatUv,
  formatWindSpeed,
  isNumber,
} from "../../utils/format.js";

function WeatherDetails({ current, units }) {
  const hasWindDirection = isNumber(current.windDirection);
  const uvPercent = isNumber(current.uvIndex) ? Math.min((current.uvIndex / 11) * 100, 100) : 0;

  const windDirectionValue = (
    <span className="wind-direction">
      {hasWindDirection && (
        <ArrowUp
          size={20}
          className="wind-arrow"
          aria-hidden="true"
          // The arrow points where the wind is blowing TO, so add 180°.
          style={{ "--rotation": `${current.windDirection + 180}deg` }}
        />
      )}
      {degreesToCompass(current.windDirection)}
    </span>
  );

  return (
    <Card id="details" title="Weather details" icon={Gauge} className="area-details">
      <div className="stat-grid">
        <StatTile icon={Droplets} label="Humidity" value={formatPercent(current.humidity)} />
        <StatTile
          icon={Wind}
          label="Wind speed"
          value={formatWindSpeed(current.windSpeed, units)}
        />
        <StatTile
          icon={Compass}
          label="Wind direction"
          value={windDirectionValue}
          hint={hasWindDirection ? `${Math.round(current.windDirection)}°` : NO_VALUE}
        />
        <StatTile icon={Gauge} label="Pressure" value={formatPressure(current.pressure, units)} />
        <StatTile icon={Eye} label="Visibility" value={formatDistance(current.visibility, units)} />
        <StatTile
          icon={Sun}
          label="UV index"
          value={formatUv(current.uvIndex)}
          hint={describeUv(current.uvIndex)}
        >
          <div className="meter" aria-hidden="true">
            <span style={{ "--value": `${uvPercent}%` }} />
          </div>
        </StatTile>
      </div>
    </Card>
  );
}

export default WeatherDetails;