import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./fonts.css";
import "./styles.css";

const normalizedPath = window.location.pathname.replace(/\/$/, "") || "/";
const Page = normalizedPath === "/regulamin"
  ? lazy(() => import("./RegulationsPage").then(module => ({ default: module.RegulationsPage })))
  : lazy(() => import("./App").then(module => ({ default: module.App })));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={null}><Page /></Suspense>
  </React.StrictMode>,
);
