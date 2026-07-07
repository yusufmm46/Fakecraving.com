import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App.jsx";
import { AppProvider } from "./context/AppContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";

registerSW({ immediate: true });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <CartProvider>
          <App />
          <Analytics />
        </CartProvider>
      </AppProvider>
    </BrowserRouter>
  </StrictMode>
);
