import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Minus, Star, X } from "lucide-react";
import { getRestaurantById } from "../lib/api";
import { useCart } from "../context/CartContext";
import { getRestaurantImage } from "../lib/cuisineImages";
import TopBar from "../components/layout/TopBar";

function resolveDish(dish, activeVariantId) {
  const activeVariant = dish.variants
    ? dish.variants.find((v) => v.id === activeVariantId) || dish.variants[dish.variants.length - 1]
    : null;
  const orderId = activeVariant ? `${dish.id}::${activeVariant.id}` : dish.id;
  return {
    orderId,
    activeVariant,
    resolved: {
      id: orderId,
      name: activeVariant ? `${dish.name} (${activeVariant.label})` : dish.name,
      price: activeVariant ? activeVariant.price : dish.price,
      description: dish.description,
      emoji: dish.emoji,
      image_url: dish.image_url,
    },
  };
}

function DishThumbnail({ dish, sizeClass }) {
  if (dish.image_url) {
    return <img src={dish.image_url} alt={dish.name} className={`${sizeClass} object-cover`} />;
  }
  return (
    <div className={`${sizeClass} flex items-center justify-center bg-marigold/15 text-3xl`}>
      {dish.emoji}
    </div>
  );
}

function VariantPicker({ variants, activeVariantId, onSelect }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {variants.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(v.id);
          }}
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-colors ${
            activeVariantId === v.id
              ? "bg-aubergine border-aubergine text-ivory"
              : "border-aubergine/20 dark:border-ivory/20 text-ink/60 dark:text-ivory/60"
          }`}
        >
          {v.label} ₹{v.price}
        </button>
      ))}
    </div>
  );
}

function QuantityControl({ qty, onAdd, onDecrease, size = "sm" }) {
  const dims = size === "lg" ? "w-9 h-9" : "w-6 h-6";
  const iconSize = size === "lg" ? 18 : 14;
  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={onAdd}
        className={`shrink-0 rounded-full bg-aubergine text-ivory font-semibold hover:opacity-90 ${
          size === "lg" ? "px-6 py-2.5 text-sm" : "px-3 py-1.5 text-xs"
        }`}
      >
        Add
      </button>
    );
  }
  return (
    <div className="shrink-0 flex items-center gap-2 bg-aubergine rounded-full px-1 py-1">
      <button
        type="button"
        onClick={onDecrease}
        aria-label="Decrease quantity"
        className={`flex items-center justify-center text-ivory ${dims}`}
      >
        <Minus size={iconSize} />
      </button>
      <span className="w-4 text-center text-xs font-semibold text-ivory">{qty}</span>
      <button
        type="button"
        onClick={onAdd}
        aria-label="Increase quantity"
        className={`flex items-center justify-center text-ivory ${dims}`}
      >
        <Plus size={iconSize} />
      </button>
    </div>
  );
}

function DishRow({ dish, restaurant, selectedVariantId, onSelectVariant, qty, addItem, updateQty, onOpenDetail }) {
  const { orderId, activeVariant, resolved } = resolveDish(dish, selectedVariantId);

  return (
    <div
      onClick={() => onOpenDetail(dish)}
      className="flex items-center gap-3 bg-white/70 dark:bg-white/5 rounded-xl p-3 border border-aubergine/10 dark:border-ivory/10 cursor-pointer hover:border-aubergine/25 dark:hover:border-ivory/25 transition-colors"
    >
      <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden">
        <DishThumbnail dish={dish} sizeClass="w-full h-full" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm text-ink dark:text-ivory truncate">{dish.name}</p>
        <p className="text-xs text-ink/50 dark:text-ivory/50 truncate">{dish.description}</p>

        {dish.variants ? (
          <div className="mt-1.5">
            <VariantPicker
              variants={dish.variants}
              activeVariantId={activeVariant.id}
              onSelect={(variantId) => onSelectVariant(dish.id, variantId)}
            />
          </div>
        ) : (
          <p className="text-sm font-semibold text-aubergine dark:text-marigold mt-0.5">
            ₹{dish.price}
          </p>
        )}
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <QuantityControl
          qty={qty}
          onAdd={() => addItem(restaurant, resolved)}
          onDecrease={() => updateQty(orderId, qty - 1)}
        />
      </div>
    </div>
  );
}

function DishDetailModal({ dish, restaurant, selectedVariantId, onSelectVariant, qty, addItem, updateQty, onClose }) {
  const { orderId, activeVariant, resolved } = resolveDish(dish, selectedVariantId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-[420px] bg-ivory dark:bg-ink rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0">
          <DishThumbnail dish={dish} sizeClass="w-full h-52" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto">
          <h2 className="font-display text-xl font-semibold text-ink dark:text-ivory">
            {dish.name}
          </h2>
          <p className="text-sm text-ink/60 dark:text-ivory/60">{dish.description}</p>

          {dish.variants ? (
            <VariantPicker
              variants={dish.variants}
              activeVariantId={activeVariant.id}
              onSelect={(variantId) => onSelectVariant(dish.id, variantId)}
            />
          ) : (
            <p className="text-lg font-semibold text-aubergine dark:text-marigold">₹{dish.price}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-ink/50 dark:text-ivory/50">
              {restaurant.name} · {restaurant.cuisine}
            </span>
            <QuantityControl
              qty={qty}
              onAdd={() => addItem(restaurant, resolved)}
              onDecrease={() => updateQty(orderId, qty - 1)}
              size="lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(undefined);
  const [variantSelections, setVariantSelections] = useState({});
  const [detailDish, setDetailDish] = useState(null);
  const { cart, addItem, updateQty, itemCount, subtotal } = useCart();

  useEffect(() => {
    getRestaurantById(id).then(setRestaurant);
  }, [id]);

  if (restaurant === undefined) {
    return (
      <div>
        <TopBar showBack title="Loading…" />
        <p className="text-center text-sm text-ink/50 dark:text-ivory/50 py-10">
          Loading restaurant…
        </p>
      </div>
    );
  }

  if (restaurant === null) {
    return (
      <div>
        <TopBar showBack title="Not found" />
        <p className="text-center text-sm text-ink/50 dark:text-ivory/50 py-10">
          That restaurant doesn't exist (which, in this app, is a very on-brand outcome).
        </p>
      </div>
    );
  }

  const qtyFor = (orderId) => cart.items.find((i) => i.id === orderId)?.qty || 0;
  const selectVariant = (dishId, variantId) =>
    setVariantSelections((prev) => ({ ...prev, [dishId]: variantId }));
  const activeVariantIdFor = (dish) =>
    dish.variants ? variantSelections[dish.id] || dish.variants[dish.variants.length - 1].id : null;

  return (
    <div className="pb-24">
      <TopBar showBack title={restaurant.name} />

      <div className="px-4 sm:px-6 pt-4">
        <div className="flex items-start gap-4 bg-white/70 dark:bg-white/5 rounded-2xl p-4 border border-aubergine/10 dark:border-ivory/10">
          <div className="w-16 h-16 shrink-0 rounded-xl bg-marigold/15 overflow-hidden">
            <img
              src={getRestaurantImage(restaurant)}
              alt={restaurant.cuisine}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-lg text-ink dark:text-ivory truncate">
              {restaurant.name}
            </h2>
            <p className="text-sm text-ink/60 dark:text-ivory/60">
              {restaurant.cuisine} · {restaurant.price_range} · {restaurant.city}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-xs font-semibold text-curry bg-curry/10 px-2 py-0.5 rounded-md">
                <Star size={12} fill="currentColor" />
                {restaurant.rating}
              </span>
              <span className="text-[11px] font-bold tracking-wide text-chili bg-chili/10 px-2 py-0.5 rounded-full">
                FAKE · {restaurant.fake_eta_min} min
              </span>
            </div>
          </div>
        </div>

        <h3 className="font-display font-semibold text-base text-ink dark:text-ivory mt-6 mb-3">
          Menu
        </h3>

        <div className="space-y-3">
          {restaurant.dishes.map((dish) => (
            <DishRow
              key={dish.id}
              dish={dish}
              restaurant={restaurant}
              selectedVariantId={activeVariantIdFor(dish)}
              onSelectVariant={selectVariant}
              qty={qtyFor(resolveDish(dish, activeVariantIdFor(dish)).orderId)}
              addItem={addItem}
              updateQty={updateQty}
              onOpenDetail={setDetailDish}
            />
          ))}
        </div>

        {restaurant.add_ons?.length > 0 && (
          <>
            <h3 className="font-display font-semibold text-base text-ink dark:text-ivory mt-6 mb-1">
              Add-ons
            </h3>
            <p className="text-xs text-ink/50 dark:text-ivory/50 mb-3">
              Popular with orders from here
            </p>
            <div className="space-y-2">
              {restaurant.add_ons.map((addOn) => {
                const qty = qtyFor(addOn.id);
                const resolvedAddOn = {
                  id: addOn.id,
                  name: addOn.name,
                  price: addOn.price,
                  description: "Add-on",
                };
                return (
                  <div
                    key={addOn.id}
                    className="flex items-center justify-between gap-3 bg-white/50 dark:bg-white/[0.03] rounded-xl px-3 py-2.5 border border-dashed border-aubergine/15 dark:border-ivory/15"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink dark:text-ivory truncate">
                        {addOn.name}
                      </p>
                      <p className="text-xs text-ink/50 dark:text-ivory/50">₹{addOn.price}</p>
                    </div>
                    <QuantityControl
                      qty={qty}
                      onAdd={() => addItem(restaurant, resolvedAddOn)}
                      onDecrease={() => updateQty(addOn.id, qty - 1)}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {detailDish && (
        <DishDetailModal
          dish={detailDish}
          restaurant={restaurant}
          selectedVariantId={activeVariantIdFor(detailDish)}
          onSelectVariant={selectVariant}
          qty={qtyFor(resolveDish(detailDish, activeVariantIdFor(detailDish)).orderId)}
          addItem={addItem}
          updateQty={updateQty}
          onClose={() => setDetailDish(null)}
        />
      )}

      {itemCount > 0 && cart.restaurant?.id === restaurant.id && (
        <button
          type="button"
          onClick={() => navigate("/cart")}
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-96 flex items-center justify-between px-5 py-3.5 rounded-full bg-chili text-white font-semibold shadow-lg"
        >
          <span>
            {itemCount} item{itemCount > 1 ? "s" : ""}
          </span>
          <span>View cart · ₹{subtotal}</span>
        </button>
      )}
    </div>
  );
}
