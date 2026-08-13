import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "@fontsource/barlow-condensed/900.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import { App } from "./App";
import { RegulationsPage } from "./RegulationsPage";
import "./styles.css";

const normalizedPath = window.location.pathname.replace(/\/$/, "") || "/";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {normalizedPath === "/regulamin" ? <RegulationsPage /> : <App />}
  </React.StrictMode>,
);
