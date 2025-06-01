import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Home from "../pages/Home";
import SendMessage from "../pages/SendMessage";
import BulkMessage from "../pages/BulkMessage";
import PublicApi from "../pages/PublicApi";
import Navbar from "../components/Navbar";
import axios from "axios";
import ReceiveMessage from "../pages/ReceiveMessage";
import { AuthProvider, useAuth } from "../context/AuthContext";
import AuthPage from "../pages/Auth";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <AuthPage />;
  }
  // Only render layout if authenticated
  return children;
}

function App() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");

  const fetchSessions = async () => {
    if (!user || !user.uid) return;
    try {
      const res = await axios.get("http://localhost:5000/sessions", {
        params: { userId: user.uid },
      });
      setSessions(res.data.sessions || []);
      const sessionIds = res.data.sessions.map((s) => s.sessionId);
      if (!selectedSession || !sessionIds.includes(selectedSession)) {
        setSelectedSession(res.data.sessions[0]?.sessionId || "");
      }
    } catch (err) {
      setSessions([]);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex flex-col h-screen">
                <Navbar
                  sessions={sessions}
                  selectedSession={selectedSession}
                  setSelectedSession={setSelectedSession}
                />
                <div className="flex flex-1 overflow-hidden">
                  <Sidebar />
                  <div className="flex-1 overflow-y-auto bg-gray-50 p-4 mt-10 ml-60">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/send" element={<SendMessage />} />
                      <Route path="/receive" element={<ReceiveMessage />} />
                      <Route path="/bulk" element={<BulkMessage />} />
                      <Route path="/api" element={<PublicApi />} />
                    </Routes>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
