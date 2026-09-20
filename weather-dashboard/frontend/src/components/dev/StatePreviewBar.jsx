const OPTIONS = [
  { value: "idle", label: "Search" },
  { value: "loading", label: "Loading" },
  { value: "error", label: "Error" },
  { value: "ready", label: "Dashboard" },
];

// Development-only helper for viewing each screen. App.jsx only renders it
// when import.meta.env.DEV is true, so it never appears in production.
function StatePreviewBar({ status, onChange }) {
  return (
    <div className="dev-bar" role="group" aria-label="Development only: preview screens">
      <span className="dev-bar-label">Dev preview</span>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`dev-bar-button ${status === option.value ? "is-active" : ""}`}
          aria-pressed={status === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default StatePreviewBar;