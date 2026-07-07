import { Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function CartItem({ item, image }) {
  const { updateQty } = useCart();
  const src = item.image_url || image;

  return (
    <div className="flex items-center gap-3 bg-white/70 dark:bg-white/5 rounded-xl p-3 border border-aubergine/10 dark:border-ivory/10">
      <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden">
        {src ? (
          <img src={src} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-marigold/15 text-2xl">
            {item.emoji}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm text-ink dark:text-ivory truncate">{item.name}</p>
        <p className="text-sm font-semibold text-aubergine dark:text-marigold">
          ₹{item.price * item.qty}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-2 bg-aubergine rounded-full px-1 py-1">
        <button
          type="button"
          onClick={() => updateQty(item.id, item.qty - 1)}
          aria-label={item.qty === 1 ? "Remove item" : "Decrease quantity"}
          className="w-6 h-6 flex items-center justify-center text-ivory"
        >
          {item.qty === 1 ? <Trash2 size={13} /> : <Minus size={14} />}
        </button>
        <span className="w-4 text-center text-xs font-semibold text-ivory">{item.qty}</span>
        <button
          type="button"
          onClick={() => updateQty(item.id, item.qty + 1)}
          aria-label="Increase quantity"
          className="w-6 h-6 flex items-center justify-center text-ivory"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
