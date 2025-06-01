import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext"; // Adjust the import based on your file structure

const SessionContext = createContext();

export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children }) => {
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState("");
  const [sessions, setSessions] = useState([]);

  // Fetch sessions globally
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user || !user.uid) return;
      try {
        const res = await axios.get("http://localhost:5000/sessions", {
          params: { userId: user.uid },
        });
        const data = res.data;
        setSessions(data.sessions || []);
        if (!selectedSession && data.sessions && data.sessions.length > 0) {
          setSelectedSession(data.sessions[0].sessionId);
        }
      } catch (err) {
        setSessions([]);
      }
    };
    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, [selectedSession, user]);

  return (
    <SessionContext.Provider
      value={{ selectedSession, setSelectedSession, sessions, setSessions }}
    >
      {children}
    </SessionContext.Provider>
  );
};
