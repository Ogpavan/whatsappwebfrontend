import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Home from "../pages/Home";
import SendMessage from "../pages/SendMessage";
import BulkMessage from "../pages/BulkMessage";
import PublicApi from "../pages/PublicApi";
import Navbar from "../components/Navbar";
import axios from "axios";

function App() {
  const [availableSessions, setAvailableSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");

  const fetchSessions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/sessions");
      setAvailableSessions(res.data.sessions);
      const sessionIds = res.data.sessions.map((s) => s.sessionId);
      if (!selectedSession || !sessionIds.includes(selectedSession)) {
        setSelectedSession(res.data.sessions[0]?.sessionId || "");
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, [selectedSession]);

  return (
    <Router>
     <div className="flex flex-col h-screen">
  {/* Navbar at top */}
  <Navbar
    sessions={availableSessions}
    selectedSession={selectedSession}
    setSelectedSession={setSelectedSession}
  />

  {/* Main content below navbar */}
  <div className="flex flex-1 overflow-hidden">
    {/* Sidebar on the left */}
    <Sidebar />

    {/* Main page content on the right */}
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4 mt-10 ml-64">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/send" element={<SendMessage />} />
        <Route path="/bulk" element={<BulkMessage />} />
        <Route path="/api" element={<PublicApi />} />
      </Routes>
    </div>
  </div>
</div>

    </Router>
  );
}

export default App;
