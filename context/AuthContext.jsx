import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../src/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Try to get user from localStorage on first load
    const stored = localStorage.getItem("waweb-user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      // Save or remove user in localStorage
      if (firebaseUser) {
        localStorage.setItem("waweb-user", JSON.stringify(firebaseUser));
      } else {
        localStorage.removeItem("waweb-user");
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    console.log("Firebase User:", user);
  }, [user]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
