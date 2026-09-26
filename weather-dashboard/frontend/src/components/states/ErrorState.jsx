import { CircleAlert, RefreshCw } from "lucide-react";

// `icon` lets callers show a fitting glyph (e.g. a "location off" icon for
// permission errors vs. a generic alert for other failures). `footnote` is
// for the short privacy reminder shown specifically on location errors.
function ErrorState({ title, message, icon: Icon = CircleAlert, footnote, onRetry, onBack }) {
  return (
    <section className="state-panel" role="alert">
      <div className="state-icon state-icon--error">
        <Icon size={36} aria-hidden="true" />
      </div>
      <h2>{title}</h2>
      <p>{message}</p>
      {footnote && <p className="state-footnote">{footnote}</p>}
      <div className="state-actions">
        {onRetry && (
          <button type="button" className="button button--primary" onClick={onRetry}>
            <RefreshCw size={18} aria-hidden="true" />
            Try again
          </button>
        )}
        <button type="button" className="button button--secondary" onClick={onBack}>
          Back to search
        </button>
      </div>
    </section>
  );
}

export default ErrorState;