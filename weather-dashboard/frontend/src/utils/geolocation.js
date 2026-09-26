// Wraps the browser Geolocation API in a Promise, and validates what it gives
// back before anything downstream trusts it.
//
// PRIVACY: this module never writes to localStorage, sessionStorage, or any
// backend on its own. A coordinate pair only ever exists in React state for
// as long as the current screen needs it, and only ever travels to OUR
// backend's /api/weather (never a third-party service). Nothing here keeps
// a history of past locations — each call is independent and unrelated to
// any previous one.

function isValidLatitude(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject({ code: "UNSUPPORTED" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Extremely unlikely from a real device, but a browser extension,
        // a buggy device sensor, or a spoofed value could hand back
        // something out of range. Catch it here rather than passing bad
        // data on to the backend (which would also reject it).
        if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
          reject({ code: "INVALID_COORDINATES" });
          return;
        }

        resolve({ latitude, longitude });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: false,
        timeout: 10000,
        // This only allows the BROWSER to reuse a position it already had
        // cached internally for up to 5 minutes — our app never stores it.
        maximumAge: 300000,
      }
    );
  });
}

// Turns a geolocation failure into { title, message, kind, retryable }.
// `kind` lets the UI pick a fitting icon; `retryable` decides whether a
// "Try again" button makes sense (it doesn't for permission/unsupported).
export function describeGeolocationError(error) {
  switch (error?.code) {
    case 1: // PERMISSION_DENIED
      return {
        kind: "permission",
        retryable: false,
        title: "Location access denied",
        message:
          "You've blocked location access for this site. Allow it in your browser's site settings, or search for a city instead.",
      };
    case 2: // POSITION_UNAVAILABLE
      return {
        kind: "unavailable",
        retryable: true,
        title: "Location unavailable",
        message: "Your device couldn't determine its position. Try again, or search for a city.",
      };
    case 3: // TIMEOUT
      return {
        kind: "timeout",
        retryable: true,
        title: "Location request timed out",
        message: "It took too long to find your location. Try again, or search for a city.",
      };
    case "UNSUPPORTED":
      return {
        kind: "unsupported",
        retryable: false,
        title: "Location not supported",
        message: "This browser doesn't support location services. Search for a city instead.",
      };
    case "INVALID_COORDINATES":
      return {
        kind: "invalid-location",
        retryable: true,
        title: "Unusable location data",
        message: "Your browser returned a location we couldn't use. Try again, or search for a city.",
      };
    default:
      return {
        kind: "unknown",
        retryable: true,
        title: "Something went wrong",
        message: "We couldn't get your location. Try again, or search for a city.",
      };
  }
}