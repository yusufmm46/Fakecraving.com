import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function LocationPicker() {
  const { location, locationStatus, setManualLocation } = useApp();
  const [open, setOpen] = useState(false);
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");

  const label = location
    ? `${location.area}, ${location.city}`
    : locationStatus === "loading"
      ? "Finding you…"
      : "Set your location";

  const submit = (e) => {
    e.preventDefault();
    if (!area.trim() || !city.trim()) return;
    setManualLocation(area.trim(), city.trim());
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-aubergine dark:text-ivory hover:opacity-80 transition-opacity max-w-[180px] sm:max-w-none truncate"
      >
        <MapPin size={16} className="shrink-0 text-chili" />
        <span className="truncate">{label}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={submit}
            className="w-full sm:w-96 bg-ivory dark:bg-aubergine rounded-2xl p-5 space-y-3 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-lg text-aubergine dark:text-ivory">
                Set your location
              </h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-ink/70 dark:text-ivory/70">
              We couldn't detect your location automatically. Enter it manually — it's only used
              to pretend food is coming from nearby.
            </p>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Area / neighbourhood"
              className="w-full px-3 py-2 rounded-lg border border-aubergine/20 dark:border-ivory/20 bg-transparent text-sm"
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="w-full px-3 py-2 rounded-lg border border-aubergine/20 dark:border-ivory/20 bg-transparent text-sm"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-aubergine text-ivory font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Save location
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
