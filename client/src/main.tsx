import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// For material icons
const materialIconsLink = document.createElement('link');
materialIconsLink.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
materialIconsLink.rel = "stylesheet";
document.head.appendChild(materialIconsLink);

// For Inter font
const interFontLink = document.createElement('link');
interFontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
interFontLink.rel = "stylesheet";
document.head.appendChild(interFontLink);

createRoot(document.getElementById("root")!).render(<App />);
