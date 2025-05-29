import React, { useEffect, useState } from "react";
import axios from "axios";

const SendMessage = () => {
  const [availableSessions, setAvailableSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState(null);
  const [messages, setMessages] = useState([]);

  const fetchSessions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/sessions");
      const validSessions = res.data.sessions || [];
      setAvailableSessions(validSessions);
      if (!selectedSession && validSessions.length > 0) {
        setSelectedSession(validSessions[0].sessionId);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  const fetchMessages = async (sessionId) => {
    try {
      const res = await axios.get(`http://localhost:5000/messages/${sessionId}`);
      setMessages(res.data || []);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession);
      const msgInterval = setInterval(() => fetchMessages(selectedSession), 5000);
      return () => clearInterval(msgInterval);
    }
  }, [selectedSession]);

  const send = async () => {
    if (!selectedSession || !number.trim()) {
      return alert("Enter all fields");
    }

    const formData = new FormData();
    formData.append("sessionId", selectedSession);
    formData.append("number", number);
    if (message) formData.append("message", message);
    if (media) formData.append("media", media);

    try {
      await axios.post("http://localhost:5000/send", formData);
      setNumber("");
      setMessage("");
      setMedia(null);
      fetchMessages(selectedSession);
    } catch (err) {
      alert("Failed to send");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-3xl mx-auto border border-gray-200">
      <h2 className="text-xl font-bold mb-5 text-gray-800 border-b pb-2">Send & View Messages</h2>

      {/* Session Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Session:</label>
        <select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {availableSessions.map((s) => (
            <option key={s.sessionId} value={s.sessionId}>
              {(s.pushname && s.pushname !== "Unknown" ? s.pushname : "Session")} ({s.phoneNumber})
            </option>
          ))}
        </select>
      </div>

      {/* Message List */}
      <div className="border rounded-lg p-3 h-64 overflow-y-auto mb-4 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm text-center mt-6">No messages found.</p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.fromMe ? "justify-end" : "justify-start"
              } mb-2`}
            >
              <div
                className={`px-4 py-2 rounded-xl text-sm max-w-xs ${
                  msg.fromMe
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {msg.message}
                <div className="text-[10px] mt-1 text-right opacity-70">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Form */}
      <input
        type="text"
        placeholder="Recipient Number"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 w-full mb-2 text-sm"
      />
      <textarea
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 w-full mb-2 text-sm h-20 resize-none"
      />
      <input
        type="file"
        onChange={(e) => setMedia(e.target.files[0])}
        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 mb-4"
        accept="*"
      />
      <button
        onClick={send}
        className="w-full py-2 rounded-lg text-white font-semibold text-sm bg-green-600 hover:bg-green-700 transition duration-200"
      >
        Send
      </button>
    </div>
  );
};

export default SendMessage;
