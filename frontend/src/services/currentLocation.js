function geolocationErrorMessage(error) {
  if (error?.code === 1) {
    return "Location permission was denied. Allow access in your browser settings, or search for a city instead.";
  }
  if (error?.code === 2) {
    return "Your location could not be determined. Try again or search for a city.";
  }
  if (error?.code === 3) {
    return "Finding your location took too long. Try again or search for a city.";
  }
  return "We couldn't get your location. Try again or search for a city.";
}

export function getCurrentCoordinates(geolocation = globalThis.navigator?.geolocation) {
  if (typeof geolocation?.getCurrentPosition !== "function") {
    return Promise.reject(new Error("Location services aren't supported by this browser."));
  }

  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(
      (position) => {
        const latitude = position?.coords?.latitude;
        const longitude = position?.coords?.longitude;
        const validLatitude = Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
        const validLongitude = Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;

        if (!validLatitude || !validLongitude) {
          reject(new Error("Your browser returned invalid coordinates. Search for a city instead."));
          return;
        }

        resolve({ latitude, longitude });
      },
      (error) => reject(new Error(geolocationErrorMessage(error))),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  });
}
