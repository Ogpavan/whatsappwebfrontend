import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { SessionProvider } from "../context/SessionContext.jsx";
import { AuthProvider } from "../context/AuthContext.jsx"; // <-- import AuthProvider

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <SessionProvider>
        <App />
      </SessionProvider>
    </AuthProvider>
  </StrictMode>
);
