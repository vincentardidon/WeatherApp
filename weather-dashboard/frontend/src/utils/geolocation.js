// Wraps the browser Geolocation API in a Promise.
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject({ code: "UNSUPPORTED" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => reject(error),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}

// Turns a geolocation error into a friendly title and message.
export function describeGeolocationError(error) {
  switch (error?.code) {
    case 1: // PERMISSION_DENIED
      return {
        title: "Location access denied",
        message:
          "Allow location access for this site in your browser settings, or search for a city instead.",
      };
    case 2: // POSITION_UNAVAILABLE
      return {
        title: "Location unavailable",
        message: "Your device could not determine its position. Try again or search for a city.",
      };
    case 3: // TIMEOUT
      return {
        title: "Location request timed out",
        message: "It took too long to find your location. Try again or search for a city.",
      };
    case "UNSUPPORTED":
      return {
        title: "Location not supported",
        message: "This browser does not support location services. Search for a city instead.",
      };
    default:
      return {
        title: "Something went wrong",
        message: "We couldn't get your location. Try again or search for a city.",
      };
  }
}