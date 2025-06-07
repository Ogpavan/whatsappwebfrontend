import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { SessionProvider } from "../context/SessionContext.jsx";
import { AuthProvider } from "../context/AuthContext.jsx"; // <-- import AuthProvider
import { BrowserRouter as Router } from "react-router-dom";
createRoot(document.getElementById("root")).render(
  <StrictMode>
      <Router>
    <AuthProvider>
      <SessionProvider>
        <App />
      </SessionProvider>
    </AuthProvider>
    </Router>
  </StrictMode>
);
