import { useEffect, useRef, useState } from "react";
import { Clock3, Heart, MapPin, Search, Star, X } from "lucide-react";
import { searchLocations } from "../../services/geocodeApi.js";
import { locationKey } from "../../utils/savedLocations.js";

const MIN_NAME_LENGTH = 2;
const DEBOUNCE_MS = 300;

function placeLabel(place) {
  return [place.name, place.region, place.country].filter(Boolean).join(", ");
}

function SearchBar({ onSearch, recents, favorites, onRemoveRecent, onToggleFavorite }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const text = query.trim();
    if (text.length < MIN_NAME_LENGTH) {
      setSuggestions([]);
      setSearching(false);
      setMessage("");
      return undefined;
    }

    const controller = new AbortController();
    setSearching(true);
    setMessage("");
    const timer = window.setTimeout(async () => {
      try {
        const results = await searchLocations(text, { signal: controller.signal });
        setSuggestions(results.filter((place) =>
          Number.isFinite(place.latitude) && Number.isFinite(place.longitude) &&
          typeof place.name === "string" && place.name.trim()
        ));
        setMessage(results.length ? "" : "No matching cities found.");
      } catch (error) {
        if (error.name !== "AbortError") setMessage("Search is unavailable. Try again shortly.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  useEffect(() => {
    const closeOnOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, []);

  const choose = (place) => {
    onSearch(place);
    setQuery(placeLabel(place));
    setSuggestions([]);
    setOpen(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const first = suggestions[0];
    if (first) {
      choose(first);
      return;
    }
    if (query.trim().length < MIN_NAME_LENGTH) {
      inputRef.current?.setCustomValidity(query.trim() ? "Enter at least 2 characters." : "Enter a city or place name.");
      inputRef.current?.reportValidity();
      return;
    }
    setOpen(true);
  };

  const hasQuery = query.trim().length >= MIN_NAME_LENGTH;
  const visibleSuggestions = suggestions.slice(0, 5);
  const showSaved = !hasQuery && (favorites.length > 0 || recents.length > 0);

  return (
    <div className="search-wrap" ref={wrapperRef}>
      <form className="search" role="search" onSubmit={handleSubmit}>
        <label htmlFor="location-search" className="visually-hidden">Search for a city or place</label>
        <Search size={18} className="search-icon" aria-hidden="true" />
        <input
          id="location-search" ref={inputRef} className="search-input" type="search"
          value={query} onChange={(event) => { event.target.setCustomValidity(""); setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)} placeholder="Search city or place" autoComplete="off" maxLength={100}
          aria-expanded={open} aria-controls="location-search-panel" aria-autocomplete="list"
        />
        {query && <button type="button" className="search-clear" aria-label="Clear search" onClick={() => { setQuery(""); setOpen(true); inputRef.current?.focus(); }}><X size={16} /></button>}
        <button type="submit" className="search-submit">Search</button>
      </form>

      {open && (hasQuery || showSaved) && (
        <div className="search-panel" id="location-search-panel" role="listbox" aria-label="Location suggestions">
          {hasQuery ? (
            <>
              <div className="search-panel-heading">{searching ? "Searching cities…" : "Matching locations"}</div>
              {visibleSuggestions.map((place) => {
                const key = locationKey(place);
                const isFavorite = favorites.some((item) => locationKey(item) === key);
                return (
                  <div className="location-option" key={key}>
                    <button type="button" className="location-option-main" role="option" onClick={() => choose(place)}>
                      <MapPin size={17} aria-hidden="true" />
                      <span><strong>{place.name}</strong><small>{[place.region, place.country].filter(Boolean).join(", ") || "Location"}</small></span>
                    </button>
                    <button type="button" className={`save-location ${isFavorite ? "is-saved" : ""}`} aria-label={`${isFavorite ? "Remove" : "Add"} ${place.name} ${isFavorite ? "from" : "to"} favorites`} title={isFavorite ? "Remove favorite" : "Add favorite"} onClick={() => onToggleFavorite(place)}>
                      <Heart size={17} fill={isFavorite ? "currentColor" : "none"} />
                    </button>
                  </div>
                );
              })}
              {message && !searching && <p className="search-panel-message">{message}</p>}
            </>
          ) : (
            <>
              {favorites.length > 0 && <SavedSection title="Favorites" icon={Star} places={favorites} onChoose={choose} onRemove={onToggleFavorite} />}
              {recents.length > 0 && <SavedSection title="Recent searches" icon={Clock3} places={recents} onChoose={choose} onRemove={onRemoveRecent} />}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SavedSection({ title, icon: Icon, places, onChoose, onRemove }) {
  return (
    <section className="saved-section" aria-label={title}>
      <div className="search-panel-heading"><Icon size={14} aria-hidden="true" />{title}</div>
      {places.map((place) => (
        <div className="location-option" key={locationKey(place)}>
          <button type="button" className="location-option-main" role="option" onClick={() => onChoose(place)}>
            <MapPin size={17} aria-hidden="true" />
            <span><strong>{place.name}</strong><small>{[place.region, place.country].filter(Boolean).join(", ")}</small></span>
          </button>
          <button type="button" className="save-location" aria-label={`Remove ${place.name} from ${title.toLowerCase()}`} title={`Remove ${place.name}`} onClick={() => onRemove(place)}><X size={17} /></button>
        </div>
      ))}
    </section>
  );
}

export default SearchBar;
