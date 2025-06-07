import React, { useEffect, useState, useRef } from "react";
import { useSession } from "../context/SessionContext";

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
  const audioRef = useRef(null);

  const { selectedSession, setSelectedSession } = useSession();

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/sessions`);
      const data = await res.json();
      const validSessions = data.sessions || [];
      setAvailableSessions(validSessions);
      if (!selectedSession && validSessions.length > 0) {
        setSelectedSession(validSessions[0].sessionId);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, []);

  const send = async () => {
    if (!selectedSession || !number.trim()) {
      return alert("Enter all fields");
    }

    setSending(true);
    setBtnAnim(true);

    // Play sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }

    const formData = new FormData();
    formData.append("sessionId", selectedSession);
    formData.append("number", number);
    if (message) formData.append("message", message);
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
      alert("Failed to send");
    } finally {
      setTimeout(() => setBtnAnim(false), 300); // Reset animation after 300ms
      setSending(false);
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
            <input
              type="text"
              placeholder="Enter phone number with country code"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Message</label>
            <textarea
              id="msg-input"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              rows="4"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Attachment</label>
            <input
              type="file"
              onChange={(e) => setMedia(e.target.files[0])}
              className="w-full"
              accept="*"
            />
            {media && (
              <div className="text-sm text-green-700 mt-2">
                File attached: {media.name}
              </div>
            )}
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
              <div className="bg-gray-50 h-16 flex items-center px-3 gap-2 ">
                <div className="flex-1 bg-white rounded-full px-4 py-2 text-gray-400 text-sm border">
                  Type a message
                </div>
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                    <path d="M2 21l21-9-21-9v7l15 2-15 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendMessage;
