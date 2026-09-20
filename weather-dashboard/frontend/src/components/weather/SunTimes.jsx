import { Sunrise, Sunset } from "lucide-react";
import Card from "../ui/Card.jsx";
import StatTile from "../ui/StatTile.jsx";
import { formatDaylight, formatTime, getSunProgress } from "../../utils/format.js";

// Geometry of the half-circle in the SVG (viewBox 0 0 200 110).
const CENTER_X = 100;
const BASE_Y = 100;
const RADIUS = 90;

function getSunPosition(progress) {
  const angle = Math.PI * (1 - progress);
  return {
    x: Math.round((CENTER_X + RADIUS * Math.cos(angle)) * 10) / 10,
    y: Math.round((BASE_Y - RADIUS * Math.sin(angle)) * 10) / 10,
  };
}

function SunTimes({ astronomy, timezone }) {
  const sun = getSunProgress(astronomy.sunrise, astronomy.sunset);
  const position = sun?.isDaytime ? getSunPosition(sun.progress) : null;

  let status = "";
  if (sun) status = sun.isDaytime ? "The sun is up" : "The sun is down";

  return (
    <Card id="sun" title="Sunrise & sunset" icon={Sunrise} className="area-sun">
      <div className="sun-arc">
        <svg viewBox="0 0 200 110" aria-hidden="true" focusable="false">
          <line className="sun-horizon" x1="0" y1="100" x2="200" y2="100" />
          <path className="sun-path" d="M 10 100 A 90 90 0 0 1 190 100" />
          {position && <circle className="sun-dot" cx={position.x} cy={position.y} r="7" />}
        </svg>
      </div>

      <div className="sun-times">
        <StatTile
          icon={Sunrise}
          label="Sunrise"
          value={formatTime(astronomy.sunrise, timezone)}
        />
        <StatTile icon={Sunset} label="Sunset" value={formatTime(astronomy.sunset, timezone)} />
      </div>

      <p className="sun-footer">
        <span>Daylight: {formatDaylight(astronomy.sunrise, astronomy.sunset)}</span>
        {status && <span>{status}</span>}
      </p>
    </Card>
  );
}

export default SunTimes;