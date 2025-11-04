// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./app/router/router";
import "./app/styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
