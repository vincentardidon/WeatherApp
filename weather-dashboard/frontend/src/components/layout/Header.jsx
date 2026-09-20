import { CloudSun, LocateFixed, Settings } from "lucide-react";
import SearchBar from "./SearchBar.jsx";

function Header({ onSearch, onLocate, onOpenSettings, isLocating }) {
  return (
    <header className="header">
      <div className="header-inner">
        <a className="brand" href="/" aria-label="Skycast home">
          <span className="brand-mark">
            <CloudSun size={22} aria-hidden="true" />
          </span>
          <span className="brand-name">Skycast</span>
        </a>

        <SearchBar onSearch={onSearch} />

        <div className="header-actions">
          <button
            type="button"
            className={`icon-button ${isLocating ? "is-busy" : ""}`}
            onClick={onLocate}
            disabled={isLocating}
            aria-label="Use my current location"
            title="Use my current location"
          >
            <LocateFixed size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            title="Settings"
          >
            <Settings size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;