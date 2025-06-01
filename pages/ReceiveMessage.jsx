import React, { useEffect, useState, useRef } from "react";
import { useSession } from "../context/SessionContext";

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString();
}

function ReceiveMessage() {
  const { selectedSession } = useSession();
  const [messages, setMessages] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const wsRef = useRef(null);

  // Collect unique contacts from messages
  const contacts = Array.from(new Set(messages.map((msg) => msg.from))).map(
    (from) => ({
      from,
      lastMsg: messages.filter((msg) => msg.from === from).slice(-1)[0],
    })
  );

  useEffect(() => {
    if (!selectedSession) return;

    const ws = new window.WebSocket(
      `ws://localhost:5000?sessionId=${selectedSession}`
    );
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setMessages((prev) => [...prev, msg]);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      ws.close();
    };
  }, [selectedSession]);

  // Select first contact by default
  useEffect(() => {
    if (!selectedContact && contacts.length > 0) {
      setSelectedContact(contacts[0].from);
    }
  }, [contacts, selectedContact]);

  // Filter messages for selected contact
  const chatMessages = messages.filter((msg) => msg.from === selectedContact);

  return (
    <div className="flex h-full  rounded  bg-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 border-r flex flex-col">
        <div className="p-4 font-bold text-md border-b bg-white">Chats</div>
        <ul className="flex-1 overflow-y-auto">
          {contacts.map((contact) => (
            <li
              key={contact.from}
              className={`cursor-pointer px-4 py-3 border-b hover:bg-gray-200 ${
                selectedContact === contact.from ? "bg-white font-semibold" : ""
              }`}
              onClick={() => setSelectedContact(contact.from)}
            >
              <div className="truncate">{contact.from}</div>
              <div className="text-xs text-gray-500 truncate">
                {contact.lastMsg?.body
                  ? contact.lastMsg.body.length > 20
                    ? contact.lastMsg.body.slice(0, 20) + "..."
                    : contact.lastMsg.body
                  : contact.lastMsg?.type}
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b bg-gray-50 font-semibold">
          {selectedContact || "Select a chat"}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {chatMessages.length === 0 ? (
            <div className="text-gray-400 text-center mt-10">
              No messages yet.
            </div>
          ) : (
            chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className="bg-white rounded shadow px-4 py-2 max-w-xl"
              >
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{msg.type}</span>
                  {msg.type === "image" && (
                    <span className="ml-2 text-gray-400">(media)</span>
                  )}
                </div>
                <div className="my-1">{msg.body}</div>
                <div className="text-xs text-gray-400 text-right">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ReceiveMessage;
