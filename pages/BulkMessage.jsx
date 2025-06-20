import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { useSession } from "../context/SessionContext";
import { FiPaperclip } from "react-icons/fi";
import { FaBold, FaPaperPlane } from "react-icons/fa";

function formatMessage(msg) {
  if (!msg) return "";
  msg = msg.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  msg = msg.replace(/\*(.*?)\*/g, "<b>$1</b>");
  msg = msg.replace(/_(.*?)_/g, "<i>$1</i>");
  msg = msg.replace(/ /g, "<br/>");
  return msg;
}

const BulkMessage = () => {
  const [rows, setRows] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [sending, setSending] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [agree, setAgree] = useState(false);

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

      // Replace all {header} placeholders with actual row values
      let msgTemplate = message || row.message || "";
      msgTemplate = msgTemplate.replace(/{(\w+)}/g, (_, key) => row[key] || "");

      formData.append("message", msgTemplate);
      if (media) formData.append("file", media); // Use "file" for media

      try {
        console.log("Sending message to:", row.number);
        await axios.post(`${import.meta.env.VITE_API_URL}/send`, formData);
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

  // Add for copy-paste bulk input
  const [bulkInput, setBulkInput] = useState("");
  const [inputMode, setInputMode] = useState("paste"); // "paste" or "file"

  const handleBulkInput = () => {
    const lines = bulkInput
      .split(" ")
      .map((line) => line.trim())
      .filter(Boolean);
    const parsedRows = lines.map((line) => {
      const [number, ...msgParts] = line.split(",");
      return {
        number: number.trim(),
        message: msgParts.join(",").trim() || "",
      };
    });
    setRows(parsedRows);
    setStatusMap({});
    setCurrentIdx(0);
  };

  // Drag and drop state
  const [dragActive, setDragActive] = useState(false);
  const [dragActiveFile, setDragActiveFile] = useState(false);
  const fileInputRef = useRef();
  const fileUploadRef = useRef();

  // Handle drag and drop for media
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setMedia(e.dataTransfer.files[0]);
    }
  };
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setMedia(e.target.files[0]);
    }
  };

  // Handle drag and drop for file upload
  const handleDragOverFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveFile(true);
  };
  const handleDragLeaveFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveFile(false);
  };
  const handleDropFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload({ target: { files: e.dataTransfer.files } });
    }
  };
  const handleFileInputClick = () => {
    fileUploadRef.current.click();
  };

  // Show preview popup before sending
  const handleSendClick = () => {
    setShowPreview(true);
  };

  const confirmSend = async () => {
    setShowPreview(false);
    await sendBulkMessages();
  };

  return (
    <div className="flex h-full bg-white overflow-hidden">
      {/* Controls Section */}
      <div className="w-1/2 flex flex-col justify-center items-center border-r p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Step 1: Choose Input Method */}
          <div className="flex gap-4 mb-2">
            <button
              className={`px-4 py-2 rounded ${
                inputMode === "paste"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setInputMode("paste")}
            >
              Paste Numbers
            </button>
            <button
              className={`px-4 py-2 rounded ${
                inputMode === "file" ? "bg-green-500 text-white" : "bg-gray-200"
              }`}
              onClick={() => setInputMode("file")}
            >
              Upload CSV File
            </button>
          </div>
          {/* Step 2: Enter Recipients */}
          {inputMode === "paste" ? (
            <div>
              <label className="block mb-1 font-medium">
                Step 1: Paste Numbers & Messages
              </label>
              <p className="text-xs text-gray-500 mb-2">
                <b>Tip:</b> Paste numbers with or without a message, one per
                line.
              </p>
              <textarea
                placeholder="One per line: 919876543210,Hello! Or just: 919876543210"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                rows={3}
              />
              <div className="flex justify-end">
                <button
                  className="px-4 py-1  text-md  bg-green-500 text-white rounded"
                  onClick={handleBulkInput}
                >
                  Add in Queue
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block mb-1 font-medium">
                Step 1: Upload Recipients File
              </label>
              <div
                className={`w-full border-2 border-dashed rounded p-4 text-center cursor-pointer transition ${
                  dragActiveFile
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300"
                }`}
                onDragOver={handleDragOverFile}
                onDragLeave={handleDragLeaveFile}
                onDrop={handleDropFile}
                onClick={handleFileInputClick}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  ref={fileUploadRef}
                  className="hidden"
                />
                <span className="text-gray-500">
                  Drag & drop your Excel/CSV file here, or{" "}
                  <span className="text-green-600 underline">
                    click to select
                  </span>
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                <p>
                  <p>
                    <strong>Disclaimer:</strong> First column must be the{" "}
                    <code>&#123;number&#125;</code>. Use{" "}
                    <code>&#123;column_name&#125;</code> to insert dynamic
                    values.
                  </p>
                </p>
              </div>
            </div>
          )}
          {/* Step 3: Preview Recipients */}
          {/* {rows.length > 0 && (
            <div>
              <label className="block mb-1 font-medium">
                Step 2: Preview Recipients
              </label>
              <ul className="border rounded p-2 max-h-24 overflow-y-auto text-sm bg-gray-50">
                {rows.map((row, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="font-mono">{row.number}</span>
                    {row.message && <span>- {row.message}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )} */}
          {/* Step 4: Compose Message */}
          <div>
            <label className="block mb-1 font-medium">
              Step 3: Write Your Message
            </label>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 flex items-center bg-white rounded-full px-3 py-2 border shadow">
                {/* Bold Button */}
                <button
                  type="button"
                  className="mr-2 text-gray-500 hover:text-green-600"
                  title="Bold"
                  onClick={() => handleFormat("bold")}
                >
                  <FaBold />
                </button>
                {/* Message Input */}
                <input
                  id="bulk-msg-input"
                  type="text"
                  placeholder="Type a message to send to all (or leave blank to use per-row message)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-gray-700"
                />
                {/* Drag and Drop Attachment */}
                <div
                  className={`relative flex items-center ml-2 mb-0 cursor-pointer transition ${
                    dragActive ? "bg-green-50 border-green-400" : ""
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    minWidth: 36,
                    minHeight: 36,
                    borderRadius: "9999px",
                  }}
                  title="Attach file (drag & drop or click)"
                >
                  <FiPaperclip className="text-gray-500 text-xl hover:text-green-600 transition" />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="*"
                  />
                  {dragActive && (
                    <div className="absolute inset-0 bg-green-100 bg-opacity-50 rounded-full border-2 border-green-400 pointer-events-none" />
                  )}
                </div>
              </div>
              {/* Send Button */}
              <button
                onClick={handleSendClick}
                disabled={sending || rows.length === 0 || !selectedSession}
                className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition disabled:opacity-50"
                title="Send"
              >
                <FaPaperPlane className="text-white text-lg" />
              </button>
            </div>
            {media && (
              <div className="text-xs text-green-700 mb-1 text-right">
                File attached: {media.name}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              <b>Tip:</b> Drag and drop a file onto the paperclip, or click it
              to choose a file.
            </div>
          </div>
          {/* Step 5: Status */}
          {rows.length > 0 && (
            <div>
              <label className="block mb-1 font-medium">
                Step 4: Sending Status
              </label>
              <ul className="space-y-1 max-h-40 overflow-y-auto text-sm border rounded p-2 bg-gray-50">
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
          )}
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

      {/* Preview Popup */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold mb-2 text-green-700">
              Preview Bulk Send
            </h3>
            <div className="max-h-48 overflow-y-auto border rounded p-2 mb-3 bg-gray-50 text-sm">
              <div className="mb-2 text-gray-700 font-semibold">
                <span>First 10 Recipients:</span>
              </div>
              <ul>
                {rows.slice(0, 10).map((row, idx) => (
                  <li key={idx} className="mb-1">
                    <span className="font-mono">{row.number}</span>
                    {row.message && <span> - {row.message}</span>}
                  </li>
                ))}
                {rows.length > 10 && (
                  <li className="text-xs text-gray-400">
                    ...and {rows.length - 10} more
                  </li>
                )}
              </ul>
            </div>
            <div className="mb-3 text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2 text-xs">
              <b>Important:</b> Sending too many messages at once may cause your
              WhatsApp number to be blocked. Try sending to a small group first.
            </div>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="agree"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="agree" className="text-sm text-gray-700">
                I agree to send these messages and understand the risks.
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-1 rounded bg-gray-200"
                onClick={() => setShowPreview(false)}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-1 rounded text-white ${
                  agree
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-green-300 cursor-not-allowed"
                }`}
                disabled={!agree}
                onClick={confirmSend}
              >
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkMessage;
