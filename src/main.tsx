import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/browser-compatibility.css";

// Build-generated SEO HTML sits inside #root so crawlers and no-JS visitors get
// real content. React always takes over on top of it: the app provides the
// styled page, navigation, header and footer that the static HTML does not.
createRoot(document.getElementById("root")!).render(<App />);
