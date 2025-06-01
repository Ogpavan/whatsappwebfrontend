import React from "react";
import { useSession } from "../context/SessionContext";
import { useAuth } from "../context/AuthContext";

const Navbar = ({ sessions = [], selectedSession, setSelectedSession }) => {
  const { user, signOut } = useAuth();

  const filteredSessions = sessions.filter((s) => s.pushname && s.phoneNumber);

  const active = filteredSessions.find((s) => s.sessionId === selectedSession);

  return (
    <nav className="fixed w-full z-50 top-0 flex items-center justify-between bg-white border-b px-4 py-3 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-800">
        WhatsApp Multi Sender
      </h1>

      <div className="flex items-center space-x-4">
        {filteredSessions.length > 0 && active && (
          <div className="flex items-center space-x-2">
            {/* Glowing Indicator */}
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>

            {/* Dropdown */}
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring focus:ring-green-300"
            >
              {filteredSessions.map(({ sessionId, pushname, phoneNumber }) => (
                <option key={sessionId} value={sessionId}>
                  {pushname} ({phoneNumber})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* User Profile & Logout */}
        {user && (
          <div className="flex items-center space-x-3 ml-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="profile"
                className="w-8 h-8 rounded-full border"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <span className="text-sm text-gray-700">{user.email}</span>
            <button
              onClick={signOut}
              className="ml-2 px-3 py-1 rounded bg-red-500 text-white text-xs hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
