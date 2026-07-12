import { NavLink } from "react-router-dom";
import { Mail } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { NAV_ITEMS } from "./navItems";
import DarkModeToggle from "../shared/DarkModeToggle";
import DonateButton from "../shared/DonateButton";
import InstagramIcon from "../shared/InstagramIcon";

const INSTAGRAM_URL = "https://www.instagram.com/fakecraving.india/";

// Contact is desktop-sidebar-only (mobile's bottom nav only has room for 4
// icons), so it's appended here rather than added to the shared NAV_ITEMS
// that BottomNav also renders.
const SIDEBAR_NAV_ITEMS = [...NAV_ITEMS, { to: "/contact", label: "Contact", icon: Mail }];

export default function Sidebar() {
  const { itemCount } = useCart();

  return (
    <aside className="hidden md:flex md:flex-col md:w-60 lg:w-64 shrink-0 h-screen sticky top-0 border-r border-aubergine/10 dark:border-ivory/10 px-4 py-6">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-aubergine flex items-center justify-center">
          <span className="font-display font-bold text-marigold text-sm">FC</span>
        </div>
        <span className="font-display font-bold text-lg text-aubergine dark:text-ivory">
          FakeCraving
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {SIDEBAR_NAV_ITEMS.map(({ to, label, icon: Icon, end, badgeKey }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-marigold/20 text-aubergine dark:text-marigold"
                  : "text-ink/60 dark:text-ivory/60 hover:bg-aubergine/5 dark:hover:bg-ivory/5"
              }`
            }
          >
            <span className="flex items-center gap-3">
              <Icon size={18} />
              {label}
            </span>
            {badgeKey === "itemCount" && itemCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-chili text-white text-[11px] leading-5 text-center font-semibold">
                {itemCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-2 px-2 pt-4 border-t border-aubergine/10 dark:border-ivory/10">
        <DonateButton className="flex-1 justify-center" />
        <DarkModeToggle />
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="FakeCraving on Instagram"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:opacity-80 transition-opacity"
        >
          <InstagramIcon size={22} />
        </a>
      </div>
    </aside>
  );
}
