import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock3, RotateCcw } from "lucide-react";
import { getOrderHistory, getRestaurantById } from "../lib/api";
import { useCart } from "../context/CartContext";
import TopBar from "../components/layout/TopBar";

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OrderHistory() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    getOrderHistory()
      .then(setOrders)
      .catch(() => setOrders([]));
  }, []);

  const reorder = async (order) => {
    const restaurant = await getRestaurantById(order.restaurant_id);
    if (!restaurant) return;
    for (const item of order.items) {
      const [baseDishId, variantId] = item.dish_id.split("::");
      const dish = restaurant.dishes.find((d) => d.id === baseDishId);
      const variant = variantId ? dish?.variants?.find((v) => v.id === variantId) : null;
      const addOn = !dish ? restaurant.add_ons?.find((a) => a.id === item.dish_id) : null;

      const resolved = dish
        ? {
            id: item.dish_id,
            name: variant ? `${dish.name} (${variant.label})` : dish.name,
            price: variant ? variant.price : dish.price,
            description: dish.description,
            emoji: dish.emoji,
            image_url: dish.image_url,
          }
        : addOn
          ? { id: addOn.id, name: addOn.name, price: addOn.price, description: "Add-on" }
          : null;

      if (!resolved) continue;
      for (let i = 0; i < item.qty; i++) addItem(restaurant, resolved);
    }
    navigate("/cart");
  };

  return (
    <div className="pb-10">
      <TopBar title="Order history" showBack />

      <div className="px-4 sm:px-6 pt-4 max-w-2xl mx-auto">
        {orders === null ? (
          <p className="text-center text-sm text-ink/50 dark:text-ivory/50 py-10">Loading…</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Clock3 size={36} className="mx-auto text-ink/20 dark:text-ivory/20" />
            <p className="text-sm text-ink/50 dark:text-ivory/50">
              No fake orders yet. Your history of things you never got is empty.
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-5 py-2.5 rounded-full bg-aubergine text-ivory text-sm font-semibold"
            >
              Place your first fake order
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white/70 dark:bg-white/5 rounded-2xl p-4 border border-aubergine/10 dark:border-ivory/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-ink dark:text-ivory truncate">
                      {order.restaurant_name}
                    </p>
                    <p className="text-xs text-ink/50 dark:text-ivory/50">
                      {formatDate(order.created_at)} · {order.items?.length || 0} item(s) · ₹
                      {order.total_amount}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-bold text-chili bg-chili/10 px-2 py-0.5 rounded-full">
                    NEVER ARRIVED
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/tracking/${order.id}`, { state: { order } })}
                    className="flex-1 py-2 rounded-full border border-aubergine/20 dark:border-ivory/20 text-xs font-semibold text-ink dark:text-ivory"
                  >
                    View tracking
                  </button>
                  <button
                    type="button"
                    onClick={() => reorder(order)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-aubergine text-ivory text-xs font-semibold"
                  >
                    <RotateCcw size={13} />
                    Reorder
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
