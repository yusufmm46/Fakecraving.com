import { Routes, Route } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import Home from "./pages/Home";
import RestaurantDetail from "./pages/RestaurantDetail";
import Cart from "./pages/Cart";
import Tracking from "./pages/Tracking";
import OrderHistory from "./pages/OrderHistory";
import About from "./pages/About";
import Contact from "./pages/Contact";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/restaurant/:id" element={<RestaurantDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/tracking/:orderId" element={<Tracking />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </AppShell>
  );
}
