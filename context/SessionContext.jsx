import React, { createContext, useContext, useState, useEffect } from "react";

const SessionContext = createContext();

export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children }) => {
  const [selectedSession, setSelectedSession] = useState("");
  const [sessions, setSessions] = useState([]);

  // Fetch sessions globally
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch("http://localhost:5000/sessions");
        const data = await res.json();
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
  }, [selectedSession]);

  return (
    <SessionContext.Provider value={{ selectedSession, setSelectedSession, sessions, setSessions }}>
      {children}
    </SessionContext.Provider>
  );
};