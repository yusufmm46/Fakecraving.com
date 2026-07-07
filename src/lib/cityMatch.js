// The restaurant catalog only covers 13 Indian metro areas (from the source
// dataset). This maps the user's detected/manual location to the closest of
// those 13 so Home can default to "restaurants near you" instead of all 914.
const CITY_COORDS = {
  Hyderabad: [17.385, 78.4867],
  Jaipur: [26.9124, 75.7873],
  Mumbai: [19.076, 72.8777],
  Chennai: [13.0827, 80.2707],
  Bangalore: [12.9716, 77.5946],
  Ahmedabad: [23.0225, 72.5714],
  Kolkata: [22.5726, 88.3639],
  Pune: [18.5204, 73.8567],
  Kochi: [9.9312, 76.2673],
  Raipur: [21.2514, 81.6296],
  Lucknow: [26.8467, 80.9462],
  Goa: [15.2993, 74.124],
  "New Delhi": [28.6139, 77.209],
};

// Common alternate spellings/neighbourhoods that should resolve to one of
// the 13 cities above rather than falling through to "no match".
const CITY_ALIASES = {
  bengaluru: "Bangalore",
  bangalore: "Bangalore",
  delhi: "New Delhi",
  "new delhi": "New Delhi",
  ncr: "New Delhi",
  gurgaon: "New Delhi",
  gurugram: "New Delhi",
  noida: "New Delhi",
  cochin: "Kochi",
  kochi: "Kochi",
  ernakulam: "Kochi",
  bombay: "Mumbai",
  mumbai: "Mumbai",
  calcutta: "Kolkata",
  kolkata: "Kolkata",
  panaji: "Goa",
  panjim: "Goa",
  goa: "Goa",
};

function haversineKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestCityByCoords(lat, lon) {
  let best = null;
  let bestDist = Infinity;
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    const dist = haversineKm([lat, lon], coords);
    if (dist < bestDist) {
      bestDist = dist;
      best = city;
    }
  }
  return { city: best, distanceKm: Math.round(bestDist) };
}

// Resolves a user location to one of the 13 catalog cities, or null if we
// have nothing to go on. Exact/aliased name match wins over coordinates.
export function resolveCatalogCity(location) {
  if (!location) return null;

  if (location.city) {
    const normalized = location.city.trim().toLowerCase();
    if (CITY_ALIASES[normalized]) return { city: CITY_ALIASES[normalized], via: "name" };
    const directMatch = Object.keys(CITY_COORDS).find((c) => c.toLowerCase() === normalized);
    if (directMatch) return { city: directMatch, via: "name" };
  }

  if (typeof location.lat === "number" && typeof location.lon === "number") {
    const { city, distanceKm } = nearestCityByCoords(location.lat, location.lon);
    return { city, via: "coords", distanceKm };
  }

  return null;
}
