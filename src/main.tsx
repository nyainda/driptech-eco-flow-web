import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/browser-compatibility.css";
import { initAutoUpdate } from "./lib/autoUpdate";

initAutoUpdate();

const root = document.getElementById("root");

if (root?.hasAttribute("data-seo-static-page")) {
  // Keep build-generated SEO guide HTML intact; createRoot would clear it.
} else if (root) {
  createRoot(root).render(<App />);
}
