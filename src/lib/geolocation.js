const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

function getCurrentPosition(options) {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

async function reverseGeocode(lat, lon) {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(lat),
    lon: String(lon),
    zoom: "14",
    addressdetails: "1",
  });
  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Reverse geocoding failed.");
  const data = await res.json();
  const address = data.address || {};
  const area =
    address.suburb || address.neighbourhood || address.locality || address.village || address.town || "";
  const city = address.city || address.county || address.state_district || address.state || "";
  return { area, city: city || area, raw: address };
}

export async function detectLocation() {
  try {
    const position = await getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 5 * 60 * 1000,
    });
    const { latitude, longitude } = position.coords;
    const { area, city } = await reverseGeocode(latitude, longitude);
    return {
      source: "geolocation",
      area: area || "Somewhere nearby",
      city: city || "Unknown City",
      lat: latitude,
      lon: longitude,
    };
  } catch {
    return {
      source: "fallback",
      area: null,
      city: null,
      lat: null,
      lon: null,
    };
  }
}
