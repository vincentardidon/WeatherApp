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

function App() {
  // Preferences (saved in the browser)
  const [units, setUnits] = useLocalStorage("weather.units", "metric");
  const [theme, setTheme] = useLocalStorage("weather.theme", "system");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Screen state: "idle" (search) | "loading" | "error" | "ready" (dashboard)
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");

  // Stage 3 will replace this with data from our backend.
  const [weather] = useState(createEmptyWeather);

  // Lets us ignore a slow location result if the user did something else meanwhile.
  const requestId = useRef(0);

  // Apply the chosen theme. "system" removes the override.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light" || theme === "dark") {
      root.dataset.theme = theme;
    } else {
      delete root.dataset.theme;
    }
  }, [theme]);

  const handleSearch = useCallback((query) => {
    requestId.current += 1;
    setError(null);
    setStatus("idle");
    setNotice(
      `You searched for "${query}". Live weather lookup will be connected in the next stage.`
    );
  }, []);

  const handleLocate = useCallback(async () => {
    requestId.current += 1;
    const thisRequest = requestId.current;

    setError(null);
    setNotice("");
    setStatus("loading");

    try {
      const { latitude, longitude } = await getCurrentPosition();
      if (thisRequest !== requestId.current) return;
      setNotice(
        `Location found (${latitude.toFixed(2)}, ${longitude.toFixed(2)}). ` +
          "Live weather lookup will be connected in the next stage."
      );
      setStatus("idle");
    } catch (geoError) {
      if (thisRequest !== requestId.current) return;
      setError(describeGeolocationError(geoError));
      setStatus("error");
    }
  }, []);

  const handleBackToSearch = useCallback(() => {
    requestId.current += 1;
    setError(null);
    setStatus("idle");
  }, []);

  // Used only by the development preview bar.
  const handlePreview = useCallback((nextStatus) => {
    requestId.current += 1;
    setNotice("");
    if (nextStatus === "error") {
      setError({
        title: "Preview: something went wrong",
        message: "This is how error messages will look in the app.",
      });
    }
    setStatus(nextStatus);
  }, []);

  let content;
  if (status === "loading") {
    content = <LoadingState />;
  } else if (status === "error") {
    content = (
      <ErrorState
        title={error?.title ?? "Something went wrong"}
        message={error?.message ?? "Please try again."}
        onRetry={handleLocate}
        onBack={handleBackToSearch}
      />
    );
  } else if (status === "ready") {
    content = <Dashboard weather={weather} units={units} />;
  } else {
    content = <EmptyState notice={notice} onUseLocation={handleLocate} />;
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Header
        onSearch={handleSearch}
        onLocate={handleLocate}
        onOpenSettings={() => setSettingsOpen(true)}
        isLocating={status === "loading"}
      />

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