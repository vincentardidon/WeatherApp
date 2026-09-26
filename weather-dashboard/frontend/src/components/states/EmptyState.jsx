import { CloudSun, LocateFixed } from "lucide-react";

function EmptyState({ onUseLocation }) {
  return (
    <section className="state-panel" aria-labelledby="empty-title">
      <div className="state-icon">
        <CloudSun size={36} aria-hidden="true" />
      </div>
      <h2 id="empty-title">Find the weather anywhere</h2>
      <p>Search for a city or place in the search bar, or use your current location.</p>

      <div className="state-actions">
        <button type="button" className="button button--primary" onClick={onUseLocation}>
          <LocateFixed size={18} aria-hidden="true" />
          Use my location
        </button>
      </div>

      <p className="state-footnote">
        We'll explain what this shares before your browser asks for permission.
      </p>
    </section>
  );
}

export default EmptyState;