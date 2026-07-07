import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { getSessionId } from "./session";

let restaurantsCache = null;

export async function getRestaurants() {
  if (restaurantsCache) return restaurantsCache;
  const res = await fetch("/data/restaurants.json");
  if (!res.ok) throw new Error("Failed to load restaurants.");
  const { restaurants } = await res.json();
  restaurantsCache = restaurants;
  return restaurants;
}

export async function getRestaurantById(id) {
  const restaurants = await getRestaurants();
  return restaurants.find((r) => r.id === id) || null;
}

const LOCAL_ORDERS_KEY = "fc_orders";
const LOCAL_STATS_BASE_KEY = "fc_stats_base";
const LOCAL_STATS_LOCAL_KEY = "fc_stats_local";

function localOrders() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY)) || [];
  } catch {
    return [];
  }
}

function statsBase() {
  let base = localStorage.getItem(LOCAL_STATS_BASE_KEY);
  if (!base) {
    base = String(48213 + Math.floor(Math.random() * 4000));
    localStorage.setItem(LOCAL_STATS_BASE_KEY, base);
  }
  return Number(base);
}

export async function placeOrder({ restaurant, items, totalAmount }) {
  const sessionId = getSessionId();
  const order = {
    id: crypto.randomUUID(),
    session_id: sessionId,
    restaurant_id: restaurant.id,
    restaurant_name: restaurant.name,
    // dish_ids is uuid[] in Supabase; variant selections use a composite
    // "dishId::variantId" cart item id, so strip to the base dish uuid here.
    // The full composite id is preserved in items[].dish_id (jsonb, untyped).
    dish_ids: items.map((i) => i.id.split("::")[0]),
    items: items.map((i) => ({ dish_id: i.id, name: i.name, price: i.price, qty: i.qty })),
    total_amount: totalAmount,
    city: restaurant.city,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const { error } = await supabase.from("orders").insert({
      id: order.id,
      session_id: order.session_id,
      restaurant_id: order.restaurant_id,
      restaurant_name: order.restaurant_name,
      dish_ids: order.dish_ids,
      items: order.items,
      total_amount: order.total_amount,
      city: order.city,
    });
    if (error) throw error;
    await supabase.rpc("increment_total_orders");
  } else {
    const orders = localOrders();
    orders.unshift(order);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
    const local = Number(localStorage.getItem(LOCAL_STATS_LOCAL_KEY) || 0);
    localStorage.setItem(LOCAL_STATS_LOCAL_KEY, String(local + 1));
  }

  return order;
}

export async function getOrderHistory() {
  const sessionId = getSessionId();

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  return localOrders();
}

export async function getTotalOrdersCount() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("stats")
      .select("value")
      .eq("key", "total_orders")
      .single();
    if (error) throw error;
    return data.value;
  }

  const local = Number(localStorage.getItem(LOCAL_STATS_LOCAL_KEY) || 0);
  return statsBase() + local;
}
