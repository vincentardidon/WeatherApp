import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import SegmentedControl from "../ui/SegmentedControl.jsx";

const UNIT_OPTIONS = [
  { value: "metric", label: "Metric (°C)" },
  { value: "imperial", label: "Imperial (°F)" },
];

const THEME_OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

// Uses the native <dialog> element: Esc to close and focus trapping are built in.
function SettingsPanel({ open, onClose, units, onUnitsChange, theme, onThemeChange }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Clicks on the dimmed backdrop land on the <dialog> element itself.
  const handleClick = (event) => {
    if (event.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="settings"
      aria-labelledby="settings-title"
      onClose={onClose}
      onClick={handleClick}
    >
      <div className="settings-body">
        <div className="settings-header">
          <h2 id="settings-title">Settings</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <SegmentedControl
          legend="Units"
          name="units"
          options={UNIT_OPTIONS}
          value={units}
          onChange={onUnitsChange}
        />

        <SegmentedControl
          legend="Theme"
          name="theme"
          options={THEME_OPTIONS}
          value={theme}
          onChange={onThemeChange}
        />

        <p className="settings-note">Your preferences are saved in this browser.</p>
      </div>
    </dialog>
  );
}

export default SettingsPanel;