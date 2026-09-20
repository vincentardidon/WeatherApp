import { CloudSun, Info, LocateFixed } from "lucide-react";

function EmptyState({ notice, onUseLocation }) {
  return (
    <section className="state-panel" aria-labelledby="empty-title">
      <div className="state-icon">
        <CloudSun size={36} aria-hidden="true" />
      </div>
      <h2 id="empty-title">Find the weather anywhere</h2>
      <p>Search for a city or place in the search bar, or use your current location.</p>

      {/* Always rendered so screen readers announce changes to the notice. */}
      <div role="status" style={{ width: "100%" }}>
        {notice && (
          <div className="notice">
            <Info size={18} aria-hidden="true" />
            <span>{notice}</span>
          </div>
        )}
      </div>

      <div className="state-actions">
        <button type="button" className="button button--primary" onClick={onUseLocation}>
          <LocateFixed size={18} aria-hidden="true" />
          Use my location
        </button>
      </div>
    </section>
  );
}

export default EmptyState;