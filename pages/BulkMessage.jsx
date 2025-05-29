import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";

const BulkMessage = () => {
  const [rows, setRows] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [statusMap, setStatusMap] = useState({});
  const [sending, setSending] = useState(false);
  const [availableSessions, setAvailableSessions] = useState([]);

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
    };

    reader.readAsBinaryString(file);
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/sessions");
      const validSessions = res.data.sessions || [];
      setAvailableSessions(validSessions);
      if (!sessionId && validSessions.length > 0) {
        setSessionId(validSessions[0].sessionId);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  useState(() => {
    fetchSessions();
  }, []);

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const sendBulkMessages = async () => {
    setSending(true);
    const updatedStatus = { ...statusMap };

    for (const [index, row] of rows.entries()) {
      const formData = new FormData();
      formData.append("sessionId", sessionId);
      formData.append("number", row.number);
      if (row.message) formData.append("message", row.message);
      if (row.mediaPath) {
        // Optional: Fetch file from input and match to row.mediaPath if necessary
      }

      try {
        await axios.post("http://localhost:5000/send", formData);
        updatedStatus[index] = "✅ Sent";
      } catch (err) {
        updatedStatus[index] = "❌ Failed";
      }

      setStatusMap({ ...updatedStatus });
      await delay(3000); // 3 second delay
    }

    setSending(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Bulk Message Sender</h1>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Select WhatsApp Session:</label>
        <select
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          className="border rounded p-2 w-full"
        >
          {availableSessions.map((s) => (
            <option key={s.sessionId} value={s.sessionId}>
              {s.pushname || "Unknown"} ({s.phoneNumber})
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          className="mb-2"
        />
      </div>

      <button
        onClick={sendBulkMessages}
        disabled={sending || rows.length === 0 || !sessionId}
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {sending ? "Sending..." : "Send Messages"}
      </button>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Message Preview</h2>
        <table className="w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Number</th>
              <th className="border p-2">Message</th>
              <th className="border p-2">Media Path</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td className="border p-2">{row.number}</td>
                <td className="border p-2">{row.message}</td>
                <td className="border p-2">{row.mediaPath || "-"}</td>
                <td className="border p-2">{statusMap[idx] || "Pending"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BulkMessage;
