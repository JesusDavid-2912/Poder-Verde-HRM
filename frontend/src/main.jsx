import React from "react";
import { createRoot } from "react-dom/client";
import HrmApp from "./HrmApp.jsx";
import "./styles/hrm.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HrmApp />
  </React.StrictMode>
);
