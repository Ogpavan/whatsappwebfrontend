import React, { useState } from "react";
import { useSession } from "../context/SessionContext";

const PublicApi = () => {
  const { selectedSession } = useSession();
  const [copiedField, setCopiedField] = useState(null);


  const domain =`${import.meta.env.VITE_API_URL }`;


  const textPayload = {
    sessionId: selectedSession || "your-session-id",
    number: "919999999999",
    message: "Hello from API!",
  };

  const mediaPayload = {
    sessionId: selectedSession || "your-session-id",
    number: "919999999999",
    caption: "Here is a file",
    media: "https://example.com/path/to/image.jpg", // Or base64 if API supports
  };

  const handleCopy = (payloadName) => {
    const text =
      payloadName === "text"
        ? JSON.stringify(textPayload, null, 2)
        : JSON.stringify(mediaPayload, null, 2);
    navigator.clipboard.writeText(text);
    setCopiedField(payloadName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg">
      <h2 className="text-xl font-bold mb-4">Public API Usage</h2>

      <p>
        <span className="font-semibold">POST</span> to{" "}
        <code className="bg-gray-100 px-2 py-1 rounded">
          {domain}/send
        </code>
      </p>

      <div className="mt-6">
        <p className="font-semibold">1. Sample Payload to Send Text:</p>
        <div className="relative mt-2">
          <pre className="bg-black text-green-200 p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify(textPayload, null, 2)}
          </pre>
          <button
            onClick={() => handleCopy("text")}
            className="absolute top-2 right-2 px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition"
          >
            {copiedField === "text" ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="mt-8">
        <p className="font-semibold">2. Sample Payload to Send Media with Caption:</p>
        <div className="relative mt-2">
          <pre className="bg-black text-yellow-200 p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify(mediaPayload, null, 2)}
          </pre>
          <button
            onClick={() => handleCopy("media")}
            className="absolute top-2 right-2 px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition"
          >
            {copiedField === "media" ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicApi;
