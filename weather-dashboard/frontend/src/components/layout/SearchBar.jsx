import { useRef, useState } from "react";
import { Search } from "lucide-react";

const MIN_NAME_LENGTH = 2;

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const handleChange = (event) => {
    event.target.setCustomValidity(""); // clear any earlier message while typing
    setQuery(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const input = inputRef.current;
    const trimmed = query.trim();
    // "Paris, France" is fine: only the name before the comma must be long enough.
    const name = trimmed.split(",")[0].trim();

    if (name.length < MIN_NAME_LENGTH) {
      // Shows the browser's own accessible validation bubble on the input.
      input.setCustomValidity(
        trimmed ? "Enter at least 2 characters." : "Enter a city or place name."
      );
      input.reportValidity();
      return;
    }

    input.setCustomValidity("");
    onSearch(trimmed);
  };

  return (
    <form className="search" role="search" onSubmit={handleSubmit}>
      <label htmlFor="location-search" className="visually-hidden">
        Search for a city or place
      </label>
      <Search size={18} className="search-icon" aria-hidden="true" />
      <input
        id="location-search"
        ref={inputRef}
        className="search-input"
        type="search"
        value={query}
        onChange={handleChange}
        placeholder="Search city or place"
        autoComplete="off"
        maxLength={100}
      />
      <button type="submit" className="search-submit">
        Search
      </button>
    </form>
  );
}

export default SearchBar;