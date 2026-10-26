// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Store } from "./app/store";
import App from "./App";
import "./index.css";

const initialTheme = localStorage.getItem("devnetwork-theme") || "light";
document.documentElement.dataset.theme = initialTheme;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={Store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: initialTheme === "dark" ? "#14141f" : "#ffffff",
              color: initialTheme === "dark" ? "#f1f5f9" : "#0f172a",
              border: initialTheme === "dark" ? "1px solid #1e1e35" : "1px solid #d9e6dc",
              fontSize:   "13px",
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
