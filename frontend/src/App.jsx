import { useEffect, useState } from "react";
import {
  AlertCircle,
  Droplets,
  MapPin,
  RefreshCw,
  Sunrise,
  Sunset,
  ThermometerSun,
  Wind,
} from "lucide-react";
import ForecastCard from "./components/ForecastCard.jsx";
import LocationSearch from "./components/LocationSearch.jsx";
import WeatherIcon from "./components/WeatherIcon.jsx";
import { getWeather } from "./services/weatherApi.js";
import {
  describeWeather,
  formatDate,
  formatMeasurement,
  formatTemperature,
  formatTime,
} from "./utils/weather.js";

const DEFAULT_LOCATION = {
  name: "Manila",
  region: "Metro Manila",
  country: "Philippines",
  label: "Manila, Metro Manila, Philippines",
  latitude: 14.5995,
  longitude: 120.9842,
};

function Metric({ icon: Icon, label, value, detail }) {
  return (
    <div className="metric-item">
      <span className="metric-icon"><Icon aria-hidden="true" size={18} /></span>
      <span className="metric-copy">
        <span className="metric-label">{label}</span>
        <strong>{value}</strong>
        <span className="metric-detail">{detail}</span>
      </span>
    </div>
  );
}

function LoadingDashboard() {
  return (
    <div className="dashboard-loading" role="status" aria-live="polite">
      <span className="loading-spinner" />
      <span>Loading local weather…</span>
    </div>
  );
}

function App() {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [unit, setUnit] = useState("C");
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError("");

    getWeather({
      latitude: location.latitude,
      longitude: location.longitude,
      signal: controller.signal,
    })
      .then((data) => {
        setWeather(data);
        setIsLoading(false);
      })
      .catch((requestError) => {
        if (requestError.name === "AbortError") return;
        setWeather(null);
        setError(requestError.message || "Weather data is unavailable right now. Please try again.");
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [location, retryCount]);

  function selectLocation(nextLocation) {
    setLocation(nextLocation);
    setWeather(null);
    setIsLoading(true);
    setError("");
  }

  const current = weather?.current;
  const today = weather?.daily?.[0];

  return (
    <main className="app-shell">
      <div className="page-container">
        <header className="app-header">
          <a className="brand" href="/" aria-label="WeatherApp home">
            <span className="brand-mark"><WeatherIcon code={2} size={23} /></span>
            <span className="brand-name">weather<span>app</span></span>
          </a>

          <div className="header-tools">
            <LocationSearch onSelect={selectLocation} />
            <div className="unit-control" role="group" aria-label="Temperature unit">
              <button
                type="button"
                className={unit === "C" ? "unit-button is-selected" : "unit-button"}
                aria-pressed={unit === "C"}
                onClick={() => setUnit("C")}
              >
                °C
              </button>
              <button
                type="button"
                className={unit === "F" ? "unit-button is-selected" : "unit-button"}
                aria-pressed={unit === "F"}
                onClick={() => setUnit("F")}
              >
                °F
              </button>
            </div>
          </div>
        </header>

        <section className="dashboard-heading" aria-labelledby="dashboard-title">
          <div>
            <p className="eyebrow">LOCAL WEATHER</p>
            <h1 id="dashboard-title">Your day, at a glance.</h1>
          </div>
          <button
            className="refresh-button"
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "is-spinning" : ""} />
            <span>Refresh</span>
          </button>
        </section>

        {isLoading && <LoadingDashboard />}

        {!isLoading && error && (
          <section className="error-card" role="alert">
            <span className="error-icon"><AlertCircle size={22} /></span>
            <div className="error-copy">
              <h2>Weather is temporarily unavailable</h2>
              <p>{error}</p>
            </div>
            <button className="retry-button" type="button" onClick={() => setRetryCount((count) => count + 1)}>
              Try again
            </button>
          </section>
        )}

        {!isLoading && !error && weather && (
          <div className="weather-content">
            <section className="current-card" aria-labelledby="current-title">
              <div className="current-card-top">
                <div className="location-heading">
                  <span className="location-pin"><MapPin size={16} /></span>
                  <div>
                    <h2 id="current-title">{location.name}</h2>
                    <p>{[location.region, location.country].filter(Boolean).join(", ")}</p>
                  </div>
                </div>
                <span className="current-date">{formatDate(today?.date, { weekday: "long", month: "long", day: "numeric" })}</span>
              </div>

              <div className="current-main">
                <div className="temperature-display">
                  <WeatherIcon code={current?.weatherCode} size={72} className="current-weather-icon" />
                  <span className="temperature-value">{formatTemperature(current?.temperature, unit)}</span>
                </div>
                <div className="condition-summary">
                  <p className="condition-label">CURRENT CONDITIONS</p>
                  <h3>{describeWeather(current?.weatherCode)}</h3>
                  <p>Feels like <strong>{formatTemperature(current?.feelsLike, unit)}</strong></p>
                </div>
              </div>

              <div className="metrics-grid" aria-label="Current weather details">
                <Metric
                  icon={ThermometerSun}
                  label="Feels like"
                  value={formatTemperature(current?.feelsLike, unit)}
                  detail="apparent temperature"
                />
                <Metric
                  icon={Droplets}
                  label="Humidity"
                  value={formatMeasurement(current?.humidity, "%")}
                  detail="relative humidity"
                />
                <Metric
                  icon={Wind}
                  label="Wind"
                  value={formatMeasurement(current?.windSpeed, "km/h")}
                  detail="wind speed"
                />
                <Metric
                  icon={Droplets}
                  label="Precipitation"
                  value={formatMeasurement(current?.precipitation, "mm")}
                  detail="current amount"
                />
              </div>
            </section>

            <section className="forecast-section" aria-labelledby="forecast-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">PLAN AHEAD</p>
                  <h2 id="forecast-title">5-day forecast</h2>
                </div>
                <span className="section-caption">Daily outlook</span>
              </div>
              {weather.daily.length > 0 ? (
                <div className="forecast-grid">
                  {weather.daily.slice(0, 7).map((day, index) => (
                    <ForecastCard key={`${day.date}-${index}`} day={day} unit={unit} index={index} />
                  ))}
                </div>
              ) : (
                <div className="unavailable-note">Forecast data is unavailable for this location.</div>
              )}
            </section>

            <section className="sunlight-section" aria-labelledby="sunlight-title">
              <div className="section-heading sunlight-heading">
                <div>
                  <p className="eyebrow">DAYLIGHT</p>
                  <h2 id="sunlight-title">Sunrise &amp; sunset</h2>
                </div>
                <span className="section-caption">Local time</span>
              </div>
              <div className="sunlight-grid">
                <div className="sunlight-card">
                  <span className="sunlight-icon sunrise-icon"><Sunrise size={22} /></span>
                  <span className="sunlight-copy"><span>Sunrise</span><strong>{formatTime(today?.sunrise)}</strong></span>
                </div>
                <div className="sunlight-card">
                  <span className="sunlight-icon sunset-icon"><Sunset size={22} /></span>
                  <span className="sunlight-copy"><span>Sunset</span><strong>{formatTime(today?.sunset)}</strong></span>
                </div>
              </div>
            </section>
          </div>
        )}

        <footer className="app-footer">
          <span>WeatherApp</span>
          <span>Weather data provided by Open-Meteo</span>
        </footer>
      </div>
    </main>
  );
}

export default App;
