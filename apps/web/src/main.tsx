/**
 * This file implements Main behavior for the application core layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/theme/ThemeProvider";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
);
