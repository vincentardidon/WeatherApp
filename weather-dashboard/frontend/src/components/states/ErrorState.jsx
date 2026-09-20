import { CircleAlert, RefreshCw } from "lucide-react";

function ErrorState({ title, message, onRetry, onBack }) {
  return (
    <section className="state-panel" role="alert">
      <div className="state-icon state-icon--error">
        <CircleAlert size={36} aria-hidden="true" />
      </div>
      <h2>{title}</h2>
      <p>{message}</p>
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