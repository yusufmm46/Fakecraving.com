import { createContext, useContext, useEffect, useState } from "react";
import { detectLocation } from "../lib/geolocation";

const AppContext = createContext(null);
const DARK_MODE_KEY = "fc_dark_mode";
const MANUAL_LOCATION_KEY = "fc_manual_location";

export function AppProvider({ children }) {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem(DARK_MODE_KEY) === "true"
  );
  const [location, setLocation] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(MANUAL_LOCATION_KEY)) || null;
    } catch {
      return null;
    }
  });
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | loading | resolved | needs-manual

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem(DARK_MODE_KEY, String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (location) return;
    let cancelled = false;
    setLocationStatus("loading");
    detectLocation().then((result) => {
      if (cancelled) return;
      if (result.source === "geolocation") {
        setLocation({ area: result.area, city: result.city, manual: false });
        setLocationStatus("resolved");
      } else {
        setLocationStatus("needs-manual");
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setManualLocation = (area, city) => {
    const loc = { area, city, manual: true };
    setLocation(loc);
    localStorage.setItem(MANUAL_LOCATION_KEY, JSON.stringify(loc));
    setLocationStatus("resolved");
  };

  const toggleDarkMode = () => setDarkMode((v) => !v);

  const value = { darkMode, toggleDarkMode, location, locationStatus, setManualLocation };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
