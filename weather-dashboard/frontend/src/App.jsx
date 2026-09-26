import { useCallback, useEffect, useRef, useState } from "react";
import Header from "./components/layout/Header.jsx";
import MobileNav from "./components/layout/MobileNav.jsx";
import SettingsPanel from "./components/layout/SettingsPanel.jsx";
import Dashboard from "./components/weather/Dashboard.jsx";
import EmptyState from "./components/states/EmptyState.jsx";
import LoadingState from "./components/states/LoadingState.jsx";
import ErrorState from "./components/states/ErrorState.jsx";
import StatePreviewBar from "./components/dev/StatePreviewBar.jsx";
import useLocalStorage from "./hooks/useLocalStorage.js";
import { createEmptyWeather } from "./data/emptyWeather.js";
import { describeGeolocationError, getCurrentPosition } from "./utils/geolocation.js";
import { ApiError } from "./services/apiClient.js";
import { locateWeather, searchWeather } from "./services/locationWeather.js";

// Geolocation errors: 1 = denied, 2 = unavailable, 3 = timeout (or our own "UNSUPPORTED").
const GEOLOCATION_CODES = [1, 2, 3, "UNSUPPORTED"];

// Turns anything thrown while loading into { title, message, retryable }.
function describeError(error) {
  if (error instanceof ApiError) {
    return { title: error.title, message: error.message, retryable: error.retryable };
  }
  if (GEOLOCATION_CODES.includes(error?.code)) {
    // Retrying can't fix "denied" or "unsupported".
    return { ...describeGeolocationError(error), retryable: error.code === 2 || error.code === 3 };
  }
  console.error(error);
  return {
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
    retryable: true,
  };
}

function App() {
  // Preferences (saved in the browser)
  const [units, setUnits] = useLocalStorage("weather.units", "metric");
  const [theme, setTheme] = useLocalStorage("weather.theme", "system");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Screen state: "idle" (search) | "loading" | "error" | "ready" (dashboard)
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null); // { title, message, retryable }
  const [weather, setWeather] = useState(createEmptyWeather);

  // The last thing the user asked for, so "Try again" can repeat it:
  // { type: "search", query } or { type: "locate" }
  const [lastRequest, setLastRequest] = useState(null);

  // Each request gets a number. If a newer request starts, older results are ignored.
  const requestId = useRef(0);
  const controllerRef = useRef(null);

  // Apply the chosen theme. "system" removes the override.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light" || theme === "dark") {
      root.dataset.theme = theme;
    } else {
      delete root.dataset.theme;
    }
  }, [theme]);

  // Cancel any request still running when the app unmounts.
  useEffect(() => () => controllerRef.current?.abort(), []);

  const cancelInFlight = useCallback(() => {
    requestId.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const runRequest = useCallback(
    async (request) => {
      cancelInFlight();
      const thisRequest = requestId.current;
      const controller = new AbortController();
      controllerRef.current = controller;

      setLastRequest(request);
      setError(null);
      setStatus("loading");

      try {
        let data;
        if (request.type === "search") {
  // /api/geocode (name -> place) then /api/weather (coordinates -> weather).
          data = await searchWeather(request.query, { signal: controller.signal });
        } else {
          const { latitude, longitude } = await getCurrentPosition();
          if (thisRequest !== requestId.current) return;
          data = await locateWeather(latitude, longitude, { signal: controller.signal });
        }

        if (thisRequest !== requestId.current) return; // a newer request took over
        setWeather(data);
        setStatus("ready");
      } catch (caught) {
        if (thisRequest !== requestId.current) return;
        setError(describeError(caught));
        setStatus("error");
      }
    },
    [cancelInFlight]
  );

  const handleSearch = useCallback((query) => runRequest({ type: "search", query }), [runRequest]);
  const handleLocate = useCallback(() => runRequest({ type: "locate" }), [runRequest]);

  const handleRetry = useCallback(() => {
    if (lastRequest) runRequest(lastRequest);
  }, [lastRequest, runRequest]);

  const handleBackToSearch = useCallback(() => {
    cancelInFlight();
    setError(null);
    setStatus("idle");
  }, [cancelInFlight]);

  // Used only by the development preview bar.
  const handlePreview = useCallback(
    (nextStatus) => {
      cancelInFlight();
      if (nextStatus === "error") {
        setError({
          title: "Preview: something went wrong",
          message: "This is how error messages will look in the app.",
          retryable: false,
        });
      }
      setStatus(nextStatus);
    },
    [cancelInFlight]
  );

  let content;
  if (status === "loading") {
    content = <LoadingState />;
  } else if (status === "error") {
    content = (
      <ErrorState
        title={error?.title ?? "Something went wrong"}
        message={error?.message ?? "Please try again."}
        onRetry={error?.retryable && lastRequest ? handleRetry : undefined}
        onBack={handleBackToSearch}
      />
    );
  } else if (status === "ready") {
    content = <Dashboard weather={weather} units={units} />;
  } else {
    content = <EmptyState onUseLocation={handleLocate} />;
  }

  const isLocating = status === "loading" && lastRequest?.type === "locate";
  const announcement =
    status === "ready" && weather.location.name ? `Showing weather for ${weather.location.name}` : "";

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Header
        onSearch={handleSearch}
        onLocate={handleLocate}
        onOpenSettings={() => setSettingsOpen(true)}
        isLocating={isLocating}
      />

      {/* Tells screen-reader users when new weather has loaded. */}
      <p className="visually-hidden" role="status">
        {announcement}
      </p>

      <main id="main" className="app-main" tabIndex={-1}>
        {import.meta.env.DEV && <StatePreviewBar status={status} onChange={handlePreview} />}
        {content}
      </main>

      {status === "ready" && <MobileNav />}

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        units={units}
        onUnitsChange={setUnits}
        theme={theme}
        onThemeChange={setTheme}
      />
    </div>
  );
}

export default App;