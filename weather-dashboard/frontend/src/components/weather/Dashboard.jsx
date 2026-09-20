import MainWeatherCard from "./MainWeatherCard.jsx";
import WeatherDetails from "./WeatherDetails.jsx";
import HourlyForecast from "./HourlyForecast.jsx";
import DailyForecast from "./DailyForecast.jsx";
import SunTimes from "./SunTimes.jsx";
import AdditionalInfo from "./AdditionalInfo.jsx";

// Lays out every weather section. `weather` follows data/emptyWeather.js.
function Dashboard({ weather, units }) {
  return (
    <div className="dashboard">
      <MainWeatherCard location={weather.location} current={weather.current} units={units} />
      <WeatherDetails current={weather.current} units={units} />
      <HourlyForecast
        hourly={weather.hourly}
        timezone={weather.location.timezone}
        units={units}
      />
      <DailyForecast daily={weather.daily} units={units} />
      <SunTimes astronomy={weather.astronomy} timezone={weather.location.timezone} />
      <AdditionalInfo additional={weather.additional} meta={weather.meta} units={units} />
    </div>
  );
}

export default Dashboard;