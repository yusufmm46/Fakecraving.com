import { useEffect, useMemo, useState } from "react";
import { getRestaurants, getTotalOrdersCount } from "../lib/api";
import { resolveCatalogCity } from "../lib/cityMatch";
import { useApp } from "../context/AppContext";
import TopBar from "../components/layout/TopBar";
import Banner from "../components/home/Banner";
import CuisineChip from "../components/home/CuisineChip";
import RestaurantCard from "../components/home/RestaurantCard";

export default function Home() {
  const { location } = useApp();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState("All");
  const [totalOrders, setTotalOrders] = useState(null);
  const [showAllCities, setShowAllCities] = useState(false);

  useEffect(() => {
    getRestaurants()
      .then(setRestaurants)
      .finally(() => setLoading(false));
    getTotalOrdersCount()
      .then(setTotalOrders)
      .catch(() => setTotalOrders(null));
  }, []);

  // Reset the "show all cities" override whenever the user's location
  // actually changes, so switching location re-applies the nearby filter.
  useEffect(() => {
    setShowAllCities(false);
  }, [location?.city, location?.lat, location?.lon]);

  const nearestCity = useMemo(() => resolveCatalogCity(location), [location]);

  const cityFiltered = useMemo(() => {
    if (showAllCities || !nearestCity) return restaurants;
    return restaurants.filter((r) => r.city === nearestCity.city);
  }, [restaurants, nearestCity, showAllCities]);

  const cuisines = useMemo(() => {
    const set = new Set(cityFiltered.map((r) => r.cuisine));
    return ["All", ...Array.from(set).sort()];
  }, [cityFiltered]);

  useEffect(() => {
    setCuisine("All");
  }, [nearestCity, showAllCities]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cityFiltered.filter((r) => {
      const matchesCuisine = cuisine === "All" || r.cuisine === cuisine;
      const matchesSearch =
        !q || r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q);
      return matchesCuisine && matchesSearch;
    });
  }, [cityFiltered, search, cuisine]);

  return (
    <div>
      <TopBar showGreeting showSearch searchValue={search} onSearchChange={setSearch} />

      <Banner />

      {totalOrders !== null && (
        <p className="text-center text-xs text-ink/50 dark:text-ivory/50 mt-4">
          🔥 {totalOrders.toLocaleString("en-IN")} fake orders placed and never delivered
        </p>
      )}

      {nearestCity && (
        <div className="flex items-center justify-center gap-2 px-4 sm:px-6 mt-3 text-xs">
          <span className="text-ink/60 dark:text-ivory/60">
            {showAllCities ? (
              "Showing restaurants in all cities"
            ) : (
              <>
                Showing spots in{" "}
                <span className="font-semibold text-ink dark:text-ivory">{nearestCity.city}</span>
                {nearestCity.via === "coords" && ` (nearest to you, ~${nearestCity.distanceKm} km)`}
              </>
            )}
          </span>
          <button
            type="button"
            onClick={() => setShowAllCities((v) => !v)}
            className="font-semibold text-chili hover:underline"
          >
            {showAllCities ? "Show nearby only" : "See all cities"}
          </button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto px-4 sm:px-6 py-4 scrollbar-none">
        {cuisines.map((c) => (
          <CuisineChip key={c} label={c} active={cuisine === c} onClick={() => setCuisine(c)} />
        ))}
      </div>

      <div className="px-4 sm:px-6 pb-8">
        {loading ? (
          <p className="text-center text-sm text-ink/50 dark:text-ivory/50 py-10">
            Loading restaurants…
          </p>
        ) : filtered.length === 0 ? (
          <div className="text-center text-sm text-ink/50 dark:text-ivory/50 py-10 space-y-2">
            <p>No restaurants match that search.</p>
            {!showAllCities && nearestCity && (
              <button
                type="button"
                onClick={() => setShowAllCities(true)}
                className="font-semibold text-chili hover:underline"
              >
                Try all cities instead
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
