import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { getRestaurantImage } from "../../lib/cuisineImages";

export default function RestaurantCard({ restaurant }) {
  return (
    <Link
      to={`/restaurant/${restaurant.id}`}
      className="group flex sm:flex-col gap-3 sm:gap-0 bg-white/70 dark:bg-white/5 rounded-2xl overflow-hidden border border-aubergine/10 dark:border-ivory/10 hover:shadow-md hover:-translate-y-0.5 transition-all p-3 sm:p-0"
    >
      <div className="shrink-0 w-20 h-20 sm:w-full sm:h-32 bg-marigold/15 overflow-hidden">
        <img
          src={getRestaurantImage(restaurant)}
          alt={restaurant.cuisine}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1 sm:p-3.5 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-ink dark:text-ivory truncate">
            {restaurant.name}
          </h3>
          <span className="shrink-0 flex items-center gap-0.5 text-xs font-semibold text-curry bg-curry/10 px-1.5 py-0.5 rounded-md">
            <Star size={11} fill="currentColor" />
            {restaurant.rating}
          </span>
        </div>
        <p className="text-xs text-ink/60 dark:text-ivory/60 truncate">
          {restaurant.cuisine} · {restaurant.price_range} · {restaurant.city}
        </p>
        <span className="inline-block text-[11px] font-bold tracking-wide text-chili bg-chili/10 px-2 py-0.5 rounded-full">
          FAKE · {restaurant.fake_eta_min} min
        </span>
      </div>
    </Link>
  );
}
