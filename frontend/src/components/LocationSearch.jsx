import { useEffect, useRef, useState } from "react";
import { LoaderCircle, MapPin, Search, X } from "lucide-react";
import { formatPlace, searchLocations } from "../services/geocodingApi.js";

export default function LocationSearch({ onSelect, onSearchStart }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionQuery, setSuggestionQuery] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackKind, setFeedbackKind] = useState("error");
  const [isOpen, setIsOpen] = useState(false);
  const queryRef = useRef("");
  const requestRef = useRef(null);
  const cacheRef = useRef({ query: "", results: [] });
  const isSubmittingRef = useRef(false);

  function lookupLocations(searchQuery) {
    const normalizedQuery = searchQuery.trim();
    const cached = cacheRef.current;
    if (cached.query === normalizedQuery) return Promise.resolve(cached.results);

    const currentRequest = requestRef.current;
    if (currentRequest?.query === normalizedQuery) return currentRequest.promise;
    currentRequest?.controller.abort();

    const controller = new AbortController();
    const request = { query: normalizedQuery, controller, promise: null };
    request.promise = searchLocations(normalizedQuery, controller.signal)
      .then((results) => {
        cacheRef.current = { query: normalizedQuery, results };
        return results;
      })
      .finally(() => {
        if (requestRef.current === request) requestRef.current = null;
      });
    requestRef.current = request;
    return request.promise;
  }

  useEffect(() => {
    const searchQuery = query.trim();
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setSuggestionQuery("");
      setIsSuggesting(false);
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const results = await lookupLocations(searchQuery);
        if (!active) return;
        setSuggestions(results);
        setSuggestionQuery(searchQuery);
        if (feedbackKind === "suggestion") setFeedback("");
      } catch (error) {
        if (active && error.name !== "AbortError") {
          setSuggestions([]);
          setFeedback("City search is unavailable. Check your connection and try again.");
          setFeedbackKind("error");
        }
      } finally {
        if (active) setIsSuggesting(false);
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
      if (requestRef.current?.query === searchQuery) {
        requestRef.current.controller.abort();
      }
    };
  }, [query]);

  function choosePlace(place) {
    onSelect({ ...place, label: formatPlace(place) });
    queryRef.current = "";
    setQuery("");
    setSuggestions([]);
    setSuggestionQuery("");
    setIsOpen(false);
    setFeedback("");
  }

  async function submitSearch(event) {
    event.preventDefault();
    const searchQuery = queryRef.current.trim();

    if (isSubmittingRef.current) return;
    if (!searchQuery) {
      setFeedback("Enter a city or location to search.");
      setFeedbackKind("error");
      setIsOpen(true);
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setFeedback("");
    setIsOpen(true);
    onSearchStart?.();

    try {
      const places = suggestionQuery === searchQuery
        ? suggestions
        : await lookupLocations(searchQuery);

      if (queryRef.current.trim() !== searchQuery) return;

      if (places.length === 0) {
        setSuggestions([]);
        setSuggestionQuery(searchQuery);
        setFeedback("Location not found. Try another name or include a region or country.");
        setFeedbackKind("error");
        return;
      }

      if (places.length === 1) {
        choosePlace(places[0]);
        return;
      }

      setSuggestions(places);
      setSuggestionQuery(searchQuery);
      setFeedback("More than one place matches. Choose the one with the right region and country.");
      setFeedbackKind("suggestion");
    } catch (error) {
      if (error.name !== "AbortError" && queryRef.current.trim() === searchQuery) {
        setFeedback("City search is unavailable. Check your connection and try again.");
        setFeedbackKind("error");
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="location-search">
      <form className="search-form" role="search" onSubmit={submitSearch}>
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
              queryRef.current = event.target.value;
              setQuery(event.target.value);
              setFeedback("");
              setSuggestions([]);
              setSuggestionQuery("");
              setIsOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setIsOpen(false);
            }}
          />
          {query && (
            <button
              className="search-clear"
              type="button"
              aria-label="Clear city search"
              onClick={() => {
                queryRef.current = "";
                setQuery("");
                setSuggestions([]);
                setSuggestionQuery("");
                setFeedback("");
              }}
            >
              <X size={16} />
            </button>
          )}
        </label>
        <button className="search-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <LoaderCircle size={16} className="is-spinning" /> : <Search size={16} />}
          <span>{isSubmitting ? "Searching" : "Search"}</span>
        </button>
      </form>

      {feedback && query.trim().length < 2 && (
        <p className={`search-feedback search-feedback-${feedbackKind}`} role={feedbackKind === "error" ? "alert" : "status"}>
          {feedback}
        </p>
      )}

      {isOpen && query.trim().length >= 2 && (
        <div className="suggestions-panel" id="location-suggestions" role="region" aria-label="City suggestions">
          {feedback && (
            <p className={`search-feedback-inline search-feedback-${feedbackKind}`} role={feedbackKind === "error" ? "alert" : "status"}>
              {feedback}
            </p>
          )}
          {(isSuggesting || isSubmitting) && <p className="suggestions-message">Searching locations…</p>}
          {!isSuggesting && !isSubmitting && !feedback && suggestions.length === 0 && (
            <p className="suggestions-message">Type a place, then press Enter or Search.</p>
          )}
          {!isSuggesting && !isSubmitting && suggestions.map((place) => (
            <button
              className="suggestion-option"
              type="button"
              key={`${place.id}-${place.latitude}-${place.longitude}`}
              onClick={() => choosePlace(place)}
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
