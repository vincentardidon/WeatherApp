import { useEffect, useRef } from "react";
import { LocateFixed, ShieldCheck, X } from "lucide-react";

// Shown ONCE per visit, before the browser's own permission prompt appears,
// so the person knows why we're about to ask and what happens to the data.
// Uses the native <dialog> element (Esc to close and focus trapping are built in).
function LocationConsentDialog({ open, onCancel, onConfirm }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleClick = (event) => {
    if (event.target === dialogRef.current) onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      className="settings"
      aria-labelledby="location-consent-title"
      onClose={onCancel}
      onClick={handleClick}
    >
      <div className="settings-body">
        <div className="settings-header">
          <h2 id="location-consent-title">Use your location?</h2>
          <button type="button" className="icon-button" onClick={onCancel} aria-label="Cancel">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="state-icon" aria-hidden="true">
          <LocateFixed size={32} />
        </div>

        <p>
          Your browser will ask for permission to share your device's location. We use it only to
          look up the weather for where you are right now.
        </p>

        <ul className="consent-points">
          <li>
            <ShieldCheck size={16} aria-hidden="true" />
            Sent once to our server to fetch the forecast — never to any other service.
          </li>
          <li>
            <ShieldCheck size={16} aria-hidden="true" />
            Not saved. We don't store your coordinates or keep a location history.
          </li>
        </ul>

        <div className="state-actions">
          <button type="button" className="button button--primary" onClick={onConfirm}>
            <LocateFixed size={18} aria-hidden="true" />
            Continue
          </button>
          <button type="button" className="button button--secondary" onClick={onCancel}>
            Not now
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default LocationConsentDialog;