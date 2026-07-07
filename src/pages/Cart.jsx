import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { placeOrder } from "../lib/api";
import { getRestaurantImage } from "../lib/cuisineImages";
import TopBar from "../components/layout/TopBar";
import CartItem from "../components/cart/CartItem";
import BillSummary from "../components/cart/BillSummary";
import CheckoutButton from "../components/cart/CheckoutButton";

export default function Cart() {
  const navigate = useNavigate();
  const { cart, subtotal, clearCart } = useCart();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  const handlePlaceOrder = async () => {
    if (!cart.restaurant || cart.items.length === 0) return;
    setPlacing(true);
    setError(null);
    try {
      const order = await placeOrder({
        restaurant: cart.restaurant,
        items: cart.items,
        totalAmount: subtotal,
      });
      clearCart();
      navigate(`/tracking/${order.id}`, { state: { order } });
    } catch {
      setError("Couldn't place your fake order — even the fake backend is having a moment. Try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (!cart.restaurant || cart.items.length === 0) {
    return (
      <div>
        <TopBar title="Your cart" showBack />
        <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 text-center">
          <ShoppingBag size={40} className="text-ink/20 dark:text-ivory/20" />
          <p className="text-sm text-ink/50 dark:text-ivory/50">
            Your cart is empty. Go add something you're never going to receive.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-2 px-5 py-2.5 rounded-full bg-aubergine text-ivory text-sm font-semibold"
          >
            Browse restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <TopBar title="Your cart" showBack />

      <div className="px-4 sm:px-6 pt-4 space-y-4">
        <p className="text-sm text-ink/60 dark:text-ivory/60">
          Ordering from <span className="font-semibold text-ink dark:text-ivory">{cart.restaurant.name}</span>
        </p>

        <div className="honesty-box px-4 py-3 text-sm text-chili">
          This is a fake order. No food will be prepared, no rider will be dispatched, and
          nothing will arrive. That's the whole point.
        </div>

        <div className="space-y-3">
          {cart.items.map((item) => (
            <CartItem key={item.id} item={item} image={getRestaurantImage(cart.restaurant)} />
          ))}
        </div>

        <BillSummary subtotal={subtotal} />

        {error && (
          <p className="text-sm text-chili bg-chili/10 rounded-xl px-4 py-3">{error}</p>
        )}
      </div>

      <div className="fixed bottom-16 md:bottom-0 inset-x-0 md:static px-4 sm:px-6 py-4 bg-ivory/95 dark:bg-ink/95 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-t md:border-t-0 border-aubergine/10 dark:border-ivory/10 md:mt-2">
        <div className="max-w-md md:mx-6">
          <CheckoutButton onClick={handlePlaceOrder} loading={placing} />
        </div>
      </div>
    </div>
  );
}
