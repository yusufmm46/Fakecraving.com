import { Home, ShoppingCart, ClipboardList, Info } from "lucide-react";

export const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/cart", label: "Cart", icon: ShoppingCart, badgeKey: "itemCount" },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/about", label: "About", icon: Info },
];
