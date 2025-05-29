import React from "react";
import { FaCircle } from "react-icons/fa";

const SessionList = ({
  sessions = [],
  selectedSession,
  setSelectedSession,
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Active Sessions</h3>

      {sessions.length === 0 ? (
        <p className="text-gray-500">No active sessions</p>
      ) : (
        <div className="space-y-2">
          {sessions.map(({ sessionId, phoneNumber, pushname }) => {
            const isSelected = selectedSession === sessionId;
            return (
              <div
                key={sessionId}
                role="button"
                onClick={() => setSelectedSession(sessionId)}
                className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-green-100 border-green-400"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <div>
                  <strong className="block text-gray-800">
                    {pushname || "Unknown"}
                  </strong>
                  <div className="text-sm text-gray-500">
                    {phoneNumber || "No number"}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <FaCircle className="text-green-500 text-xs" />
                  <span className="text-sm text-green-600">Online</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SessionList;
