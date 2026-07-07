import { ChevronLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import LocationPicker from "../shared/LocationPicker";
import DarkModeToggle from "../shared/DarkModeToggle";
import DonateButton from "../shared/DonateButton";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function TopBar({
  showGreeting = false,
  showSearch = false,
  searchValue = "",
  onSearchChange,
  title,
  showBack = false,
}) {
  const navigate = useNavigate();
  const { location } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-ivory/90 dark:bg-ink/90 backdrop-blur-md border-b border-aubergine/10 dark:border-ivory/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {showBack && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-aubergine/5 dark:hover:bg-ivory/10"
              >
                <ChevronLeft size={20} className="text-aubergine dark:text-ivory" />
              </button>
            )}
            <div className="min-w-0">
              {showGreeting ? (
                <>
                  <p className="font-display text-lg sm:text-xl font-semibold text-aubergine dark:text-ivory truncate">
                    {greeting()} 👋
                  </p>
                  <LocationPicker />
                </>
              ) : (
                <p className="font-display text-lg font-semibold text-aubergine dark:text-ivory truncate">
                  {title}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <DonateButton />
            <DarkModeToggle />
          </div>
        </div>

        {showSearch && (
          <div className="mt-3 relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 dark:text-ivory/40"
            />
            <input
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search restaurants or cuisines…"
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/70 dark:bg-white/5 border border-aubergine/10 dark:border-ivory/10 text-sm text-ink dark:text-ivory placeholder:text-ink/40 dark:placeholder:text-ivory/40 outline-none focus:ring-2 focus:ring-marigold/50"
            />
          </div>
        )}
      </div>
    </header>
  );
}
