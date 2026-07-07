import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getOrderHistory } from "../lib/api";
import TopBar from "../components/layout/TopBar";
import MapMock from "../components/tracking/MapMock";
import TrackingSteps, { STEPS } from "../components/tracking/TrackingSteps";
import HonestyBox from "../components/tracking/HonestyBox";
import ShareCard from "../components/share/ShareCard";

const STEP_DURATIONS_MS = [4000, 5000, 6000, 5000]; // Placed, Cooking, Picked up, Arriving
const TOTAL_MS = STEP_DURATIONS_MS.reduce((a, b) => a + b, 0);

export default function Tracking() {
  const { orderId } = useParams();
  const routeState = useLocation().state;
  const navigate = useNavigate();

  const [order, setOrder] = useState(routeState?.order || undefined);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (order !== undefined) return;
    getOrderHistory().then((orders) => {
      setOrder(orders.find((o) => o.id === orderId) || null);
    });
  }, [order, orderId]);

  useEffect(() => {
    if (!order) return;
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.min(Date.now() - start, TOTAL_MS));
    }, 100);
    return () => clearInterval(interval);
  }, [order]);

  const activeIndex = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < STEP_DURATIONS_MS.length; i++) {
      acc += STEP_DURATIONS_MS[i];
      if (elapsed < acc) return i;
    }
    return STEP_DURATIONS_MS.length - 1;
  }, [elapsed]);

  const progress = elapsed / TOTAL_MS;
  const arrived = elapsed >= TOTAL_MS;

  if (order === undefined) {
    return (
      <div>
        <TopBar showBack title="Tracking" />
        <p className="text-center text-sm text-ink/50 dark:text-ivory/50 py-10">
          Loading order…
        </p>
      </div>
    );
  }

  if (order === null) {
    return (
      <div>
        <TopBar showBack title="Tracking" />
        <div className="text-center py-14 px-6 space-y-3">
          <p className="text-sm text-ink/50 dark:text-ivory/50">
            We couldn't find that order. Even the fake tracking failed.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-5 py-2.5 rounded-full bg-aubergine text-ivory text-sm font-semibold"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <TopBar showBack title="Tracking your fake order" />

      <div className="px-4 sm:px-6 pt-4 space-y-5 max-w-xl mx-auto">
        <MapMock progress={progress} arrived={arrived} />

        <div className="bg-white/70 dark:bg-white/5 rounded-2xl p-4 border border-aubergine/10 dark:border-ivory/10">
          <p className="text-sm text-ink/60 dark:text-ivory/60">
            {order.restaurant_name || order.restaurant?.name}
          </p>
          <p className="font-display font-semibold text-lg text-ink dark:text-ivory">
            {arrived ? "Arriving now" : STEPS[activeIndex]}
          </p>
          <div className="mt-5">
            <TrackingSteps activeIndex={activeIndex} />
          </div>
        </div>

        {arrived && (
          <>
            <HonestyBox />
            <ShareCard order={order} />
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full py-3 rounded-full bg-aubergine text-ivory font-semibold text-sm"
            >
              Order another fake meal
            </button>
          </>
        )}
      </div>
    </div>
  );
}
