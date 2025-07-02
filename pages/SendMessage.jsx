import React, { useEffect, useState, useRef } from "react";
import { useSession } from "../context/SessionContext";
import { useAuth } from "../context/AuthContext";
import { FiPaperclip } from "react-icons/fi";
import { FaPaperPlane } from "react-icons/fa";

function formatMessage(msg) {
  if (!msg) return "";
  msg = msg.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  msg = msg.replace(/\*(.*?)\*/g, "<b>$1</b>");
  msg = msg.replace(/_(.*?)_/g, "<i>$1</i>");
  msg = msg.replace(/\n/g, "<br/>");
  return msg;
}

const SendMessage = () => {
  const [availableSessions, setAvailableSessions] = useState([]);
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState(null);
  const [sending, setSending] = useState(false);
  const [btnAnim, setBtnAnim] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [matchedContacts, setMatchedContacts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const audioRef = useRef(null);
  const fileInputRef = useRef();

  const { sessions, selectedSession, setSelectedSession } = useSession();
  const { user } = useAuth();

  const fetchSessions = async () => {
    if (!user || !user.uid) return;
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/sessions?userId=${user.uid}`
    );
    const data = await res.json();
    console.log("Fetched sessions:", data);
    const validSessions = data.sessions || [];
    setAvailableSessions(validSessions);
    if (!selectedSession && validSessions.length > 0) {
      setSelectedSession(validSessions[0].sessionId);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch contacts when session changes
  useEffect(() => {
    if (!selectedSession) return;
    fetch(
      `${import.meta.env.VITE_API_URL}/contacts?sessionId=${selectedSession}`
    )
      .then((res) => res.json())
      .then((data) => setContacts(data.contacts || []));
  }, [selectedSession]);

  const isValidPhoneNumber = (num) => /^\d{12}$/.test(num.replace("@c.us", "")); // Only 12 digit numbers

  // Match contact as user types
  useEffect(() => {
    const search = number.trim().toLowerCase();
    if (!search) {
      setMatchedContacts([]);
      setShowDropdown(false);
      return;
    }
    const matches = contacts.filter(
      (c) =>
        isValidPhoneNumber(c.number) &&
        (c.number.replace("@c.us", "").includes(search) ||
          (c.name && c.name.toLowerCase().includes(search)))
    );
    setMatchedContacts(matches);
    setShowDropdown(matches.length > 0);
  }, [number, contacts]);

  const send = async () => {
    if (!selectedSession || !number.trim()) {
      return alert("Enter all fields");
    }

    setSending(true);
    setBtnAnim(true);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }

    const formData = new FormData();
    formData.append("sessionId", selectedSession);
    formData.append("number", number);
    formData.append("message", message);
    if (media) formData.append("media", media);

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/send`, {
        method: "POST",
        body: formData,
      });
      setNumber("");
      setMessage("");
      setMedia(null);
    } catch (err) {
      alert("Failed to send message");
    } finally {
      setSending(false);
      setBtnAnim(false);
    }
  };

  return (
    <div className="flex h-full bg-white overflow-hidden">
      {/* Hidden audio element */}
      <audio ref={audioRef} src="/send.mp3" preload="auto" />
      {/* Left: Controls */}
      <div className="w-1/2 flex flex-col justify-center items-center border-r p-8">
        <div className="w-full max-w-md space-y-6">
          <div>
            <label className="block mb-1 font-medium">Recipient Number</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter phone number with country code"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                onFocus={() => setShowDropdown(matchedContacts.length > 0)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)} // delay to allow click
                autoComplete="off"
              />
              {showDropdown && (
                <div className="absolute z-20 bg-white border w-full mt-1 rounded shadow max-h-48 overflow-y-auto">
                  {matchedContacts.map((contact, idx) => (
                    <div
                      key={contact.number + idx}
                      className="px-3 py-2 hover:bg-green-100 cursor-pointer flex flex-col"
                      onClick={() => {
                        setNumber(contact.number.replace("@c.us", ""));
                        setShowDropdown(false);
                      }}
                    >
                      <span className="font-semibold">
                        {contact.name || contact.number.replace("@c.us", "")}
                      </span>
                      <span className="text-xs text-gray-600">
                        {contact.number.replace("@c.us", "")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="flex-1 flex items-center bg-white rounded-md px-3 py-2 border shadow">
              <textarea
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-700"
              />
              {/* Attachment Button */}
              <label className="cursor-pointer flex items-center ml-2">
                <FiPaperclip className="text-gray-500 text-xl hover:text-green-600 transition" />
                <input
                  type="file"
                  onChange={(e) => setMedia(e.target.files[0])}
                  className="hidden"
                  accept="*"
                />
              </label>
            </div>
            {/* Send Button */}
            {/* <button
              onClick={send}
              disabled={sending || !number.trim()}
              className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition disabled:opacity-50"
            >
              <FaPaperPlane className="text-white text-lg" />
            </button> */}
          </div>
          <button
            onClick={send}
            disabled={sending}
            className={`w-full py-2 rounded bg-green-600 text-white font-bold transition-transform duration-200 ${
              btnAnim ? "scale-95" : ""
            }`}
          >
            {sending ? "Sending..." : "Send Message"}
          </button>
        </div>
      </div>
      {/* Right: Phone Preview */}
      <div className="w-1/2 flex items-center justify-center">
        <div className="relative w-[320px] h-[640px] flex items-center justify-center">
          <img
            src="/phone.png"
            alt="Phone Frame"
            className="absolute inset-0 w-full h-full z-10 pointer-events-none select-none"
            draggable={false}
          />
          <div
            className="absolute z-0"
            style={{
              left: "10px",
              top: "59px",
              width: "300px",
              height: "520px",
            }}
          >
            <div className="w-full h-full overflow-hidden flex flex-col">
              {/* WhatsApp Header */}
              <div className="bg-green-600 h-16 flex items-center px-4 gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-semibold">Recipient</div>
                  <div className="text-green-100 text-xs">online</div>
                </div>
              </div>
              {/* Chat Background */}
              <div
                className="flex-1 px-3 py-4 flex flex-col justify-end relative"
                style={{
                  background: `url('/bg.jpg')`,
                }}
              >
                {media && media.type.startsWith("image") ? (
                  <div className="flex justify-end mb-2">
                    <div className="bg-green-500 text-white p-2 rounded-2xl text-sm max-w-[85%] shadow-lg">
                      <img
                        src={URL.createObjectURL(media)}
                        alt="preview"
                        className="max-w-full rounded-lg mb-2"
                        style={{ maxHeight: "200px", objectFit: "cover" }}
                      />
                      {message && (
                        <div
                          className="break-words whitespace-pre-line"
                          dangerouslySetInnerHTML={{
                            __html: formatMessage(message),
                          }}
                        />
                      )}
                      <div className="text-right text-xs text-green-100 mt-1">
                        {new Date().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end mb-2">
                    <div className="bg-green-500 text-white px-3 py-2 rounded-2xl text-sm max-w-[85%] shadow-lg">
                      <div
                        className="break-words whitespace-pre-line"
                        dangerouslySetInnerHTML={{
                          __html:
                            formatMessage(message) ||
                            "<span class='text-green-200 italic'>Your message will appear here...</span>",
                        }}
                      />
                      <div className="text-right text-xs text-green-100 mt-1">
                        {new Date().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {media && !media.type.startsWith("image") && (
                  <div className="flex justify-end mb-2">
                    <div className="bg-white text-gray-600 px-3 py-2 rounded-2xl text-xs shadow border flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Media attached
                    </div>
                  </div>
                )}
              </div>
              {/* WhatsApp Input Bar */}
              <div className="bg-gray-50 h-16 flex items-center px-3 gap-2">
                <div
                  className="flex-1 flex items-center bg-white rounded-full px-2 py-2 border"
                  style={{ maxWidth: "90%" }}
                >
                  <input
                    type="text"
                    placeholder="Type a message"
                    // value={message}
                    // onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 bg-transparent outline-none px-2 text-gray-700"
                  />
                  {/* Attachment Button */}
                  <label className="cursor-pointer flex items-center mr-2">
                    <FiPaperclip className="text-gray-500 text-xl hover:text-green-600 transition" />
                    <input
                      type="file"
                      // onChange={(e) => setMedia(e.target.files[0])}
                      className="hidden"
                      accept="*"
                    />
                  </label>
                </div>
                {/* Send Button */}
                {/* <button
                  onClick={send}
                  disabled={sending}
                  className="ml-2 w-10 h-10 bg-green-500   flex items-center justify-center shadow-lg hover:bg-green-600 transition disabled:opacity-50"
                >
                  <FaPaperPlane className="text-white text-lg" />
                </button> */}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* WhatsApp-style Message Input Bar */}
    </div>
  );
};

export default SendMessage;
