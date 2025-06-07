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

const contactCache = {};

async function getContactInfo(number, sessionId) {
  if (contactCache[number]) return contactCache[number];
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/contact/${encodeURIComponent(number)}?sessionId=${encodeURIComponent(
        sessionId
      )}`
    );
    const data = await res.json();
    contactCache[number] = {
      name: data.name || number,
      profilePic:
        data.profilePic ||
        `https://ui-avatars.com/?name=${encodeURIComponent(number)}`,
    };
    return contactCache[number];
  } catch {
    return {
      name: number,
      profilePic: `https://ui-avatars.com/?name=${encodeURIComponent(number)}`,
    };
  }
}

function ReceiveMessage() {
  const { selectedSession } = useSession();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [input, setInput] = useState("");
  const [contactInfos, setContactInfos] = useState({});
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  const myNumber = user?.phoneNumber || "YOUR_WHATSAPP_NUMBER@c.us";

  // Collect unique contacts from messages
  const contactSet = new Set();
  messages.forEach((msg) => {
    if (msg.from !== myNumber) {
      contactSet.add(msg.from);
    }
    if (msg.to && msg.to !== myNumber) {
      contactSet.add(msg.to);
    }
  });
  const contacts = Array.from(contactSet).map((contact) => {
    const info = contactInfos[contact] || { name: contact, profilePic: `https://ui-avatars.com/api/?name=${encodeURIComponent(contact)}` };
    return {
      from: contact,
      name: info.name,
      profilePic: info.profilePic,
      lastMsg: messages
        .filter(
          (msg) =>
            msg.from === contact && (!msg.to || msg.to === myNumber)
        )
        .slice(-1)[0],
    };
  });

  useEffect(() => {
    if (!selectedSession) return;

    const ws = new window.WebSocket(
      `wss://${import.meta.env.VITE_API_URL}?sessionId=${selectedSession}`
    );
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log("Received message:", msg); // <-- Add this
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

  // Fetch contact infos
  useEffect(() => {
    async function fetchContacts() {
      const infos = {};
      for (const contact of contactSet) {
        infos[contact] = await getContactInfo(contact, selectedSession);
      }
      setContactInfos(infos);
    }
    if (selectedSession && contactSet.size > 0) fetchContacts();
    // eslint-disable-next-line
  }, [Array.from(contactSet).join(","), selectedSession]);

  // Filter messages for selected contact
  const chatMessages = messages.filter(
    (msg) =>
      // Received: from selectedContact, and (to is me OR to is missing)
      (msg.from === selectedContact && (!msg.to || msg.to === myNumber)) ||
      // Sent: from me to selectedContact
      (msg.from === myNumber && msg.to === selectedContact)
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

  // Auto-scroll to bottom when chatMessages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

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
      deleteDoc(
        doc(
          db,
          "users",
          user.uid,
          "sessions",
          selectedSession,
          "messages",
          docSnap.id
        )
      )
    );
    await Promise.all(deletions);
    // Remove from UI
    setMessages((prev) => prev.filter((msg) => msg.from !== selectedContact));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedSession || !selectedContact || !user) return;

    const newMsg = {
      from: myNumber,
      to: selectedContact,
      body: input,
      type: "text",
      timestamp: Math.floor(Date.now() / 1000),
    };

    // 1. Send to backend API
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/send`, {
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
    <div className="flex h-full rounded bg-white overflow-hidden">
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
              <div className="flex items-center space-x-3">
                <img
                  src={contact.profilePic}
                  alt={contact.name}
                  className="w-8 h-8 rounded-full object-cover border"
                />
                <div>
                  <div className="truncate font-medium">{contact.name}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {contact.lastMsg?.body
                      ? contact.lastMsg.body.length > 20
                        ? contact.lastMsg.body.slice(0, 20) + "..."
                        : contact.lastMsg.body
                      : contact.lastMsg?.type}
                  </div>
                </div>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#ece5dd]">
          {chatMessages.length === 0 ? (
            <div className="text-gray-400 text-center mt-10">
              No messages yet.
            </div>
          ) : (
            chatMessages.map((msg, idx) => {
              const isSent = msg.from === myNumber;
              return (
                <div
                  key={idx}
                  className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-xs shadow
                      ${isSent
                        ? "bg-[#d9fdd3] text-gray-900 rounded-br-none"
                        : "bg-white text-gray-900 rounded-bl-none"}
                    `}
                    style={{
                      borderTopLeftRadius: isSent ? 16 : 4,
                      borderTopRightRadius: isSent ? 4 : 16,
                      borderBottomLeftRadius: 16,
                      borderBottomRightRadius: 16,
                    }}
                  >
                    <div className="text-sm">{msg.body}</div>
                    <div className="text-xs text-gray-500 text-right mt-1">
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
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
