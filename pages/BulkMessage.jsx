import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { useSession } from "../context/SessionContext";

function formatMessage(msg) {
  if (!msg) return "";
  msg = msg.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  msg = msg.replace(/\*(.*?)\*/g, "<b>$1</b>");
  msg = msg.replace(/_(.*?)_/g, "<i>$1</i>");
  msg = msg.replace(/\n/g, "<br/>");
  return msg;
}

const BulkMessage = () => {
  const [rows, setRows] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [sending, setSending] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState(null);

  const { selectedSession } = useSession();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setRows(data);
      setStatusMap({});
      setCurrentIdx(0);
    };

    reader.readAsBinaryString(file);
  };

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const sendBulkMessages = async () => {
    setSending(true);
    const updatedStatus = {};

    for (let index = 0; index < rows.length; index++) {
      setCurrentIdx(index);
      const row = rows[index];
      const formData = new FormData();
      formData.append("sessionId", selectedSession);
      formData.append("number", row.number);
      formData.append("message", message || row.message || "");
      if (media) formData.append("media", media);

      try {
        await axios.post("http://localhost:5000/send", formData);
        updatedStatus[index] = "✅ Sent";
      } catch (err) {
        updatedStatus[index] = "❌ Failed";
      }

      setStatusMap({ ...updatedStatus });
      await delay(2000);
    }

    setSending(false);
    setCurrentIdx(-1);
  };

  const handleFormat = (type) => {
    const textarea = document.getElementById("bulk-msg-input");
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
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        selectionStart + 1,
        selectionEnd + 1 + (type === "bold" ? 1 : 0)
      );
    }, 0);
  };

  // Preview data for the current recipient
  const previewRow = rows[currentIdx] || {};

  return (
    <div className="flex h-full bg-white overflow-hidden">
      {/* Controls Section */}
      <div className="w-1/2 flex flex-col justify-center items-center border-r p-8">
        <div className="w-full max-w-md space-y-6">
          <div>
            <label className="block mb-1 font-medium">
              Upload Recipients File
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              Upload a file with columns: <b>number</b>, <b>message</b>{" "}
              (optional)
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium">Message</label>
            <textarea
              id="bulk-msg-input"
              placeholder="Type a message to send to all (or leave blank to use per-row message)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              rows="4"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-100 border font-bold"
              onClick={() => handleFormat("bold")}
            >
              <span className="font-bold">B</span> Bold
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-100 border italic"
              onClick={() => handleFormat("italic")}
            >
              <span className="italic">I</span> Italic
            </button>
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
            onClick={sendBulkMessages}
            disabled={sending || rows.length === 0 || !selectedSession}
            className="w-full py-2 rounded bg-green-600 text-white font-bold disabled:opacity-50"
          >
            {sending
              ? `Sending (${currentIdx + 1}/${rows.length})...`
              : "Send Bulk Messages"}
          </button>
          <div>
            <h2 className="font-semibold mb-2">Bulk Send Status</h2>
            <ul className="space-y-1 max-h-40 overflow-y-auto text-sm">
              {rows.map((row, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="font-mono">{row.number}</span>
                  <span>
                    {statusMap[idx] === "✅ Sent" && (
                      <span className="text-green-600">{statusMap[idx]}</span>
                    )}
                    {statusMap[idx] === "❌ Failed" && (
                      <span className="text-red-600">{statusMap[idx]}</span>
                    )}
                    {!statusMap[idx] && (
                      <span className="text-gray-400">Pending</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {/* Phone Preview Section */}
      <div className="w-1/2 flex items-center justify-center">
        <div className="relative w-[320px] h-[640px] flex items-center justify-center">
          {/* Phone frame image */}
          <img
            src="/phone.png"
            alt="Phone Frame"
            className="absolute inset-0 w-full h-full z-10 pointer-events-none select-none"
            draggable={false}
          />
          {/* Phone preview content positioned inside the frame */}
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
                  <div className="text-white font-semibold">
                    {previewRow.number || "Recipient"}
                  </div>
                  <div className="text-green-100 text-xs">online</div>
                </div>
              </div>
              {/* Chat area */}
              <div
                className="flex-1 px-3 py-4 flex flex-col justify-end relative"
                style={{ background: `url('/bg.jpg')` }}
              >
                {media && media.type && media.type.startsWith("image") ? (
                  <div className="flex justify-end mb-2">
                    <div className="bg-green-500 text-white p-2 rounded-2xl text-sm max-w-[85%] shadow-lg">
                      <img
                        src={URL.createObjectURL(media)}
                        alt="preview"
                        className="max-w-full rounded-lg mb-2"
                        style={{ maxHeight: "200px", objectFit: "cover" }}
                      />
                      {(message || previewRow.message) && (
                        <div
                          className="break-words whitespace-pre-line"
                          dangerouslySetInnerHTML={{
                            __html: formatMessage(
                              message || previewRow.message
                            ),
                          }}
                        />
                      )}
                      <div className="text-right text-xs text-green-100 mt-1">
                        {statusMap[currentIdx] ||
                          (sending ? "Sending..." : "Pending")}
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
                            formatMessage(message || previewRow.message) ||
                            "<span class='text-green-200 italic'>Your message will appear here...</span>",
                        }}
                      />
                      <div className="text-right text-xs text-green-100 mt-1">
                        {statusMap[currentIdx] ||
                          (sending ? "Sending..." : "Pending")}
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
              {/* WhatsApp Input Bar (fake) */}
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

export default BulkMessage;
