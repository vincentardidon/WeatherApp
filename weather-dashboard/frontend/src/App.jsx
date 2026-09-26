import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, CloudOff, CircleAlert, LocateOff, MapPinOff } from "lucide-react";
import Header from "./components/layout/Header.jsx";
import MobileNav from "./components/layout/MobileNav.jsx";
import SettingsPanel from "./components/layout/SettingsPanel.jsx";
import LocationConsentDialog from "./components/layout/LocationConsentDialog.jsx";
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

// Icon shown in the error screen for each kind of failure. Anything to do
// with location gets a "location off" glyph so the cause is recognisable
// before the person even reads the message.
const ERROR_ICONS = {
  permission: LocateOff,
  unsupported: LocateOff,
  unavailable: MapPinOff,
  "invalid-location": MapPinOff,
  timeout: Clock,
  api: CloudOff,
  unknown: CircleAlert,
};

// A short reassurance repeated at the point of failure, not just before the
// browser's permission prompt — someone who just said no to location access
// benefits from being reminded exactly what they declined and why.
const LOCATION_PRIVACY_FOOTNOTE =
  "We only ever use this to look up local weather. Nothing is stored or shared.";

const LOCATION_KINDS = new Set(["permission", "unsupported", "unavailable", "timeout", "invalid-location"]);

// Turns anything thrown while loading into { title, message, icon, retryable, footnote }.
function describeError(error) {
  if (error instanceof ApiError) {
    return {
      title: error.title,
      message: error.message,
      icon: ERROR_ICONS.api,
      retryable: error.retryable,
      footnote: null,
    };
  }
  if (error && "code" in error) {
    const { kind, retryable, title, message } = describeGeolocationError(error);
    return {
      title,
      message,
      icon: ERROR_ICONS[kind] ?? ERROR_ICONS.unknown,
      retryable,
      footnote: LOCATION_KINDS.has(kind) ? LOCATION_PRIVACY_FOOTNOTE : null,
    };
  }
  console.error(error);
  return {
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
    icon: ERROR_ICONS.unknown,
    retryable: true,
    footnote: null,
  };
}

function App() {
  // Preferences (saved in the browser)
  const [units, setUnits] = useLocalStorage("weather.units", "metric");
  const [theme, setTheme] = useLocalStorage("weather.theme", "system");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Whether we've explained location use once already THIS VISIT. A ref, not
  // state that's saved anywhere: it starts over on every page load, on
  // purpose — we don't remember this choice across visits, and we never
  // keep any kind of location history.
  const hasExplainedLocationUse = useRef(false);
  const [consentOpen, setConsentOpen] = useState(false);

  // Screen state: "idle" (search) | "loading" | "error" | "ready" (dashboard)
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null); // shape from describeError()
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
          // Asks the browser for permission, then sends the coordinates to
          // OUR backend ONLY, once, purely to fetch the forecast for them.
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

  // Entry point for the "use my location" button. The first time this runs
  // in a visit, it shows our own explanation BEFORE the browser's native
  // permission prompt; after that (this visit only) it goes straight to it.
  const beginLocate = useCallback(() => {
    if (hasExplainedLocationUse.current) {
      runRequest({ type: "locate" });
    } else {
      setConsentOpen(true);
    }
  }, [runRequest]);

  const handleConsentConfirm = useCallback(() => {
    hasExplainedLocationUse.current = true;
    setConsentOpen(false);
    runRequest({ type: "locate" });
  }, [runRequest]);

  const handleConsentCancel = useCallback(() => setConsentOpen(false), []);

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
          icon: ERROR_ICONS.unknown,
          retryable: false,
          footnote: null,
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
        icon={error?.icon}
        footnote={error?.footnote}
        onRetry={error?.retryable && lastRequest ? handleRetry : undefined}
        onBack={handleBackToSearch}
      />
    );
  } else if (status === "ready") {
    content = <Dashboard weather={weather} units={units} />;
  } else {
    content = <EmptyState onUseLocation={beginLocate} />;
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
        onLocate={beginLocate}
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

      <LocationConsentDialog
        open={consentOpen}
        onCancel={handleConsentCancel}
        onConfirm={handleConsentConfirm}
      />
    </div>
  );
}

export default App;