import { useEffect, useState } from "react";
import { CloudSun, CircleCheck, CircleX, Activity } from "lucide-react";

function App() {
  // "checking" | "online" | "offline"
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    const controller = new AbortController();

    async function checkBackend() {
      try {
        const response = await fetch("/api/health", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }
        await response.json();
        setApiStatus("online");
      } catch (error) {
        if (error.name !== "AbortError") {
          setApiStatus("offline");
        }
      }
    }

    checkBackend();
    return () => controller.abort();
  }, []);

  return (
    <main className="welcome">
      <CloudSun size={72} strokeWidth={1.5} className="welcome-icon" />
      <h1>Weather Dashboard</h1>
      <p>Welcome! Weather features are coming soon.</p>

      <div className={`status status-${apiStatus}`}>
        {apiStatus === "checking" && (
          <>
            <Activity size={18} /> Checking backend...
          </>
        )}
        {apiStatus === "online" && (
          <>
            <CircleCheck size={18} /> Backend connected
          </>
        )}
        {apiStatus === "offline" && (
          <>
            <CircleX size={18} /> Backend not reachable
          </>
        )}
      </div>
    </main>
  );
}

export default App;