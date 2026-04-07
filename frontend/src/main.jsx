import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./i18n";
import "./global.css";
import "./responsive.css";

const savedLang = localStorage.getItem("lang") || "en";
document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
document.documentElement.lang = savedLang;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
