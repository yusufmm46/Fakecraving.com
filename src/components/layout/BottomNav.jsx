import { NavLink } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { NAV_ITEMS } from "./navItems";

export default function BottomNav() {
  const { itemCount } = useCart();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-ivory/95 dark:bg-ink/95 backdrop-blur-md border-t border-aubergine/10 dark:border-ivory/10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, badgeKey }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 py-2.5 px-3 text-xs font-medium transition-colors ${
                isActive ? "text-chili" : "text-ink/50 dark:text-ivory/50"
              }`
            }
          >
            <span className="relative">
              <Icon size={22} />
              {badgeKey === "itemCount" && itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-chili text-white text-[10px] leading-4 text-center font-semibold">
                  {itemCount}
                </span>
              )}
            </span>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
