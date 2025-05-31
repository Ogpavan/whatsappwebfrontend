import React, { useEffect, useState } from "react";
import { useSession } from "../context/SessionContext"; // <-- import context

function formatMessage(msg) {
  if (!msg) return "";
  // Escape HTML
  msg = msg.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Bold: *text*
  msg = msg.replace(/\*(.*?)\*/g, "<b>$1</b>");
  // Italic: _text_
  msg = msg.replace(/_(.*?)_/g, "<i>$1</i>");
  // Newlines
  msg = msg.replace(/\n/g, "<br/>");
  return msg;
}

const SendMessage = () => {
  const [availableSessions, setAvailableSessions] = useState([]);
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState(null);
  const [messages, setMessages] = useState([]);

  const { selectedSession, setSelectedSession } = useSession(); // <-- use context

  const fetchSessions = async () => {
    try {
      const res = await fetch("http://localhost:5000/sessions");
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

  const fetchMessages = async (sessionId) => {
    try {
      const res = await fetch(`http://localhost:5000/messages/${sessionId}`);
      const data = await res.json();
      setMessages(data || []);
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
      await fetch("http://localhost:5000/send", {
        method: "POST",
        body: formData
      });
      setNumber("");
      setMessage("");
      setMedia(null);
      fetchMessages(selectedSession);
    } catch (err) {
      alert("Failed to send");
    }
  };

  const handleFormat = (type) => {
    const textarea = document.getElementById("msg-input");
    if (!textarea) return;
    let selectionStart = textarea.selectionStart;
    let selectionEnd = textarea.selectionEnd;
    let before = message.slice(0, selectionStart);
    let selected = message.slice(selectionStart, selectionEnd);
    let after = message.slice(selectionEnd);

    if (type === "bold") {
      setMessage(before + "*" + selected + "*" + after);
    } else if (type === "italic") {
      setMessage(before + "_" + selected + "_" + after);
    }
    // Restore focus and selection after update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        selectionStart + 1,
        selectionEnd + 1 + (type === "bold" ? 1 : 0)
      );
    }, 0);
  };

  return (
    <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Controls Section */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
             
              <div className="p-6 space-y-6">
                {/* Session Selector */}
                {/* <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Active Session
                  </label>
                  <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors bg-gray-50 hover:bg-white"
                  >
                    {availableSessions.map((s) => (
                      <option key={s.sessionId} value={s.sessionId}>
                        {(s.pushname && s.pushname !== "Unknown" ? s.pushname : "Session")} ({s.phoneNumber})
                      </option>
                    ))}
                  </select>
                </div> */}

                {/* Recipient */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Recipient Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter phone number with country code"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors bg-gray-50 hover:bg-white"
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Message
                  </label>
                  <textarea
                    id="msg-input"
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors bg-gray-50 hover:bg-white resize-none"
                    rows="4"
                  />
                </div>

                {/* Formatting Tools */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Text Formatting
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 border-2 border-gray-200 hover:border-gray-300 font-bold text-gray-700 transition-all duration-200 hover:scale-105"
                      onClick={() => handleFormat("bold")}
                    >
                      <span className="font-bold">B</span> Bold
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 border-2 border-gray-200 hover:border-gray-300 italic text-gray-700 transition-all duration-200 hover:scale-105"
                      onClick={() => handleFormat("italic")}
                    >
                      <span className="italic">I</span> Italic
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                    💡 Use <span className="font-bold">*bold*</span> and <span className="italic">_italic_</span> formatting in your message
                  </p>
                </div>

                {/* Media Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Attachment
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={(e) => setMedia(e.target.files[0])}
                      className="w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 file:transition-colors border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-green-400 transition-colors"
                      accept="*"
                    />
                  </div>
                  {media && (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                      </svg>
                      File attached: {media.name}
                    </div>
                  )}
                </div>

                {/* Send Button */}
                <button
                  onClick={send}
                  className="w-full py-4 rounded-xl text-white font-bold text-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>

          {/* Phone Preview Section */}
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative w-[320px] h-[640px] flex items-center justify-center">
              {/* Phone frame image */}
              <img
                src="/phone.png" // Place your frame image in public/ as phone.png
                alt="Phone Frame"
                className="absolute inset-0 w-full h-full z-10 pointer-events-none select-none"
                draggable={false}
              />
              {/* Phone preview content positioned inside the frame */}
              <div
                className="absolute z-0"
                style={{
                  left: "10px",   // Adjust these values to fit your frame's screen area
                  top: "59px",
                  width: "300px",
                  height: "520px",
                }}
              >
                <div className="w-full h-full   overflow-hidden flex flex-col">
                  {/* WhatsApp Header */}
                  <div className="bg-green-600 h-16 flex items-center px-4 gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
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
                      background: `url('/bg.jpg')` // Place your background image in public/ as bg.jpg
                    }}
                  >
                    {/* Message Preview */}
                    {(media && media.type.startsWith("image")) ? (
                      <div className="flex justify-end mb-2">
                        <div className="bg-green-500 text-white p-2 rounded-2xl text-sm max-w-[85%] shadow-lg">
                          <img
                            src={URL.createObjectURL(media)}
                            alt="preview"
                            className="max-w-full rounded-lg mb-2"
                            style={{ maxHeight: '200px', objectFit: 'cover' }}
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
                            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end mb-2">
                        <div className="bg-green-500 text-white px-3 py-2 rounded-2xl text-sm max-w-[85%] shadow-lg">
                          <div
                            className="break-words whitespace-pre-line"
                            dangerouslySetInnerHTML={{
                              __html: formatMessage(message) || 
                              "<span class='text-green-200 italic'>Your message will appear here...</span>",
                            }}
                          />
                          <div className="text-right text-xs text-green-100 mt-1">
                            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Media attachment indicator */}
                    {media && !media.type.startsWith("image") && (
                      <div className="flex justify-end mb-2">
                        <div className="bg-white text-gray-600 px-3 py-2 rounded-2xl text-xs shadow border flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
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
      </div>
    </div>
  );
};

export default SendMessage;