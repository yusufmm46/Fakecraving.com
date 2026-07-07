import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "fc_cart";

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { restaurant: null, items: [] };
  } catch {
    return { restaurant: null, items: [] };
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addItem = (restaurant, dish) => {
    setCart((prev) => {
      // Cart can only hold dishes from one restaurant at a time, like a real
      // delivery app — switching restaurants clears the previous cart.
      if (prev.restaurant && prev.restaurant.id !== restaurant.id) {
        return { restaurant, items: [{ ...dish, qty: 1 }] };
      }
      const existing = prev.items.find((i) => i.id === dish.id);
      const items = existing
        ? prev.items.map((i) => (i.id === dish.id ? { ...i, qty: i.qty + 1 } : i))
        : [...prev.items, { ...dish, qty: 1 }];
      return { restaurant, items };
    });
  };

  const updateQty = (dishId, qty) => {
    setCart((prev) => {
      if (qty <= 0) {
        const items = prev.items.filter((i) => i.id !== dishId);
        return { restaurant: items.length ? prev.restaurant : null, items };
      }
      return { ...prev, items: prev.items.map((i) => (i.id === dishId ? { ...i, qty } : i)) };
    });
  };

  const clearCart = () => setCart({ restaurant: null, items: [] });

  const { itemCount, subtotal } = useMemo(() => {
    return cart.items.reduce(
      (acc, i) => ({
        itemCount: acc.itemCount + i.qty,
        subtotal: acc.subtotal + i.qty * i.price,
      }),
      { itemCount: 0, subtotal: 0 }
    );
  }, [cart.items]);

  const value = { cart, addItem, updateQty, clearCart, itemCount, subtotal };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
