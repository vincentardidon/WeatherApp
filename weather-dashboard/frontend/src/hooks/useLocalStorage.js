import { useEffect, useState } from "react";

// Like useState, but the value is saved in the browser's localStorage.
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be unavailable (private mode, quota). The app still works.
    }
  }, [key, value]);

  return [value, setValue];
}

export default useLocalStorage;