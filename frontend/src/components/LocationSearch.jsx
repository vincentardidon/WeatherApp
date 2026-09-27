import { useEffect, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import { formatPlace, searchLocations } from "../services/geocodingApi.js";

export default function LocationSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setSuggestions([]);
      setSearchError("");
      setIsSearching(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError("");
      try {
        const results = await searchLocations(trimmedQuery, controller.signal);
        setSuggestions(results);
      } catch (error) {
        if (error.name !== "AbortError") {
          setSuggestions([]);
          setSearchError("Couldn't load city suggestions. Check your connection and try again.");
        }
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function choose(place) {
    onSelect({ ...place, label: formatPlace(place) });
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setSearchError("");
  }

  return (
    <div className="location-search">
      <label className="search-field" htmlFor="location-search-input">
        <Search aria-hidden="true" size={18} />
        <input
          id="location-search-input"
          type="search"
          value={query}
          placeholder="Search a city"
          autoComplete="off"
          aria-label="Search for a city"
          aria-expanded={isOpen && query.trim().length >= 2}
          aria-controls="location-suggestions"
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setIsOpen(false);
            if (event.key === "Enter" && suggestions.length === 1) choose(suggestions[0]);
          }}
        />
        {query && (
          <button
            className="search-clear"
            type="button"
            aria-label="Clear city search"
            onClick={() => setQuery("")}
          >
            <X size={16} />
          </button>
        )}
      </label>

      {isOpen && query.trim().length >= 2 && (
        <div className="suggestions-panel" id="location-suggestions" role="listbox" aria-label="City suggestions">
          {isSearching && <p className="suggestions-message">Searching locations…</p>}
          {!isSearching && searchError && <p className="suggestions-message suggestions-error">{searchError}</p>}
          {!isSearching && !searchError && suggestions.length === 0 && (
            <p className="suggestions-message">No matching places found.</p>
          )}
          {!isSearching && suggestions.map((place) => (
            <button
              className="suggestion-option"
              type="button"
              role="option"
              aria-selected="false"
              key={`${place.id}-${place.latitude}-${place.longitude}`}
              onClick={() => choose(place)}
            >
              <span className="suggestion-pin"><MapPin size={16} /></span>
              <span className="suggestion-copy">
                <span className="suggestion-name">{place.name}</span>
                <span className="suggestion-detail">
                  {[place.region, place.country].filter(Boolean).join(", ")}
                  {place.countryCode && ` · ${place.countryCode}`}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
