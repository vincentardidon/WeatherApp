import { useState } from "react";
import { Search } from "lucide-react";

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) onSearch(trimmed);
  };

  return (
    <form className="search" role="search" onSubmit={handleSubmit}>
      <label htmlFor="location-search" className="visually-hidden">
        Search for a city or place
      </label>
      <Search size={18} className="search-icon" aria-hidden="true" />
      <input
        id="location-search"
        className="search-input"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
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