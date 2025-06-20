import React, { useEffect, useState, useRef } from "react";
import { MdSend } from "react-icons/md";
import axios from "axios";
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
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const contactCache = {};

async function getContactInfo(number, sessionId) {
  if (contactCache[number]) return contactCache[number];
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/contact/${encodeURIComponent(
        number
      )}?sessionId=${encodeURIComponent(sessionId)}`
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
  const { selectedSession, phoneNumber } = useSession(); // <-- get phoneNumber here
  const { user: authUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [input, setInput] = useState("");
  const [contactInfos, setContactInfos] = useState({});
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  const myNumber = phoneNumber + "@c.us"; // Use the session's phone number

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
    const info = contactInfos[contact] || {
      name: contact,
      profilePic: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        contact
      )}`,
    };
    return {
      from: contact,
      name: info.name,
      profilePic: info.profilePic,
      lastMsg: messages
        .filter(
          (msg) => msg.from === contact && (!msg.to || msg.to === myNumber)
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

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      console.log("Received message:", msg);

      // Save to Firestore
      if (user && selectedSession) {
        await addDoc(
          collection(
            db,
            "users",
            user.uid,
            "sessions",
            selectedSession,
            "messages"
          ),
          msg
        );
      }

      // Update UI
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

  // Show both sent and received messages for the selected chat
  const chatMessages = messages.filter(
    (msg) =>
      (msg.from === selectedContact && msg.to === myNumber) || // received
      (msg.from === myNumber && msg.to === selectedContact) // sent
  );

  useEffect(() => {
    console.log("Selected Contact:", selectedContact);
    console.log("My Number:", myNumber);
    console.log("User:", chatMessages);
    console.log("Selected Session:", selectedSession);
    console.log("All Messages:", messages);
  }, [selectedContact, myNumber, selectedSession, messages]);

  // Fetch messages from Firestore on session/user change
  useEffect(() => {
    if (!selectedSession || !authUser) return;
    const fetchMessages = async () => {
      const q = query(
        collection(
          db,
          "users",
          authUser.uid,
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
  }, [selectedSession, authUser]);

  const getAllChats = async () => {
    if (!selectedSession) setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/get-all-chats`,
        { params: { sessionId: selectedSession } }
      );
      setChats(res.data.chats || []);
      console.log(res.data);
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    }
    setLoading(false);
  };
  // Auto-scroll to bottom when chatMessages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedContact, chatMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedSession || !selectedContact || !authUser)
      return;

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
      console.error("Failed to send message:", err);
    }

    // 2. Save to Firestore
    await addDoc(
      collection(
        db,
        "users",
        authUser.uid,
        "sessions",
        selectedSession,
        "messages"
      ),
      newMsg
    );

    // 3. Instantly update UI -- REMOVE THIS LINE!
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  };

  const fetchMessages = async (chatId) => {
    if (!selectedSession || !chatId) {
      // alert("Please select a chat first.");
      return;
    }

    setLoading(true);
    try {
      console.log("Fetching messages...");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/get-messages`,
        {
          params: { sessionId: selectedSession, chatId, limit: 50 },
        }
      );
      console.log("Fetched messages:", res.data.messages);
      setMessages(res.data.messages || []); // Update state with fetched messages
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    getAllChats();
  }, [selectedSession]);

  return (
    <div className="flex h-full bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 shadow bg-white border-r flex flex-col">
        <div className="p-4 font-bold text-lg border-b bg-green-600  text-white">
          Chats
        </div>
        <ul className="flex-1 overflow-y-auto overflow-x-hidden">
          {chats.map((chat) => (
            <li
              key={chat.id._serialized}
              className={`cursor-pointer px-4 py-3 border-b hover:bg-gray-200 ${
                selectedContact === chat.id._serialized
                  ? "bg-gray-100 font-semibold"
                  : ""
              }`}
              onClick={() => {
                setSelectedContact(chat.id._serialized);
                fetchMessages(chat.id._serialized); // Fetch messages for the selected chat
              }}
            >
              <div className="flex items-center space-x-3">
                <img
                  src={
                    chat.profilePic ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      chat.name || chat.id.user
                    )}`
                  }
                  alt={chat.name || chat.id.user}
                  className="w-10 h-10 rounded-full object-cover border"
                />

                <div>
                  <div className="truncate font-medium">
                    {chat.name || chat.id.user}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {chat.lastMessage?.body || "No messages yet"}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b bg-green-600 font-semibold flex items-center text-white justify-between">
          <span>{selectedContact || "Select a chat"}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#ece5dd]">
          {chatMessages.length === 0 ? (
            <div className="text-gray-400 text-center mt-10">
              No messages yet
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isSent = msg.from === myNumber;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-xs shadow ${
                      isSent
                        ? "bg-[#d9fdd3] text-gray-900 rounded-br-none"
                        : "bg-white text-gray-900 rounded-bl-none"
                    }`}
                  >
                    {msg.type === "chat" && (
                      <div className="text-sm break-all">{msg.body}</div>
                    )}
                    {msg.type === "image" && msg.body && (
                      <img
                        src={
                          msg.body.startsWith("http")
                            ? msg.body
                            : msg.body.startsWith("/media/")
                            ? `${import.meta.env.VITE_API_URL}${msg.body}`
                            : msg.body.length > 100
                            ? `data:image/jpeg;base64,${msg.body}`
                            : `${import.meta.env.VITE_API_URL}/media/${
                                msg.body
                              }`
                        }
                        alt="Image"
                        className="w-full h-auto rounded-lg"
                      />
                    )}
                    {msg.type === "document" && (
                      <a
                        href={msg.body} // Assuming `body` contains the document URL
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        {msg.body}
                      </a>
                    )}
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
              className="bg-green-500 rounded-full w-10 h-10 flex items-center justify-center ml-2 hover:bg-green-600 disabled:opacity-50 transition"
              disabled={!input.trim() || !selectedContact}
            >
              <MdSend className="text-white text-lg" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReceiveMessage;
