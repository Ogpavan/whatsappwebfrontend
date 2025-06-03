import React, { useEffect, useState, useRef } from "react";
import { useSession } from "../context/SessionContext";
import { db } from "../src/firebase";
import {
  collection,
  query,
  getDocs,
  orderBy,
  deleteDoc,
  doc,
  where,
  addDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString();
}

function ReceiveMessage() {
  const { selectedSession } = useSession();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [input, setInput] = useState("");
  const wsRef = useRef(null);

  // Collect unique contacts from messages
  const contactSet = new Set();
  messages.forEach((msg) => {
    if (msg.from !== user.uid) {
      contactSet.add(msg.from);
    }
    if (msg.to && msg.to !== user.uid) {
      contactSet.add(msg.to);
    }
  });
  const contacts = Array.from(contactSet).map((contact) => ({
    from: contact,
    lastMsg: messages
      .filter(
        (msg) =>
          (msg.from === contact && msg.to === user.uid) ||
          (msg.from === user.uid && msg.to === contact)
      )
      .slice(-1)[0],
  }));

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
  const chatMessages = messages.filter(
    (msg) =>
      (msg.from === selectedContact && msg.to === user.uid) || // received
      (msg.from === user.uid && msg.to === selectedContact)    // sent
  );

  // Fetch messages from Firestore on session/user change
  useEffect(() => {
    if (!selectedSession || !user) return;
    const fetchMessages = async () => {
      const q = query(
        collection(
          db,
          "users",
          user.uid,
          "sessions",
          selectedSession,
          "messages"
        ),
        orderBy("timestamp", "asc")
      );
      const querySnapshot = await getDocs(q);
      setMessages(querySnapshot.docs.map((doc) => doc.data()));
    };
    fetchMessages();
  }, [selectedSession, user]);

  // Clear chat handler
  const handleClearChat = async () => {
    if (!selectedSession || !user || !selectedContact) return;
    // Query all messages for this contact
    const q = query(
      collection(
        db,
        "users",
        user.uid,
        "sessions",
        selectedSession,
        "messages"
      ),
      where("from", "==", selectedContact)
    );
    const querySnapshot = await getDocs(q);
    // Delete each message
    const deletions = querySnapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, "users", user.uid, "sessions", selectedSession, "messages", docSnap.id))
    );
    await Promise.all(deletions);
    // Remove from UI
    setMessages((prev) => prev.filter((msg) => msg.from !== selectedContact));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedSession || !selectedContact || !user) return;

    const newMsg = {
      from: user.uid,
      to: selectedContact,
      body: input,
      type: "text",
      timestamp: Math.floor(Date.now() / 1000),
    };

    // 1. Send to backend API
    try {
      await fetch("http://localhost:5000/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSession,
          number: selectedContact,
          message: input,
        }),
      });
    } catch (err) {
      // Optionally handle API error
    }

    // 2. Save to Firestore
    await addDoc(
      collection(
        db,
        "users",
        user.uid,
        "sessions",
        selectedSession,
        "messages"
      ),
      newMsg
    );

    // 3. Instantly update UI
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  };

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
        <div className="p-4 border-b bg-gray-50 font-semibold flex items-center justify-between">
          <span>{selectedContact || "Select a chat"}</span>
          {selectedContact && (
            <button
              className="text-xs text-red-500 border border-red-300 rounded px-2 py-1 hover:bg-red-50"
              onClick={handleClearChat}
            >
              Clear Chat
            </button>
          )}
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
        <div className="p-4 border-t bg-white flex">
          <form onSubmit={handleSendMessage} className="flex w-full">
            <input
              type="text"
              className="flex-1 border rounded-l px-3 py-2 focus:outline-none"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!selectedContact}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 disabled:opacity-50"
              disabled={!input.trim() || !selectedContact}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReceiveMessage;
