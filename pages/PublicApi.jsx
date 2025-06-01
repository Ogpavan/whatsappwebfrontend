import React, { useState } from "react";
import { useSession } from "../context/SessionContext";

const PublicApi = () => {
  const { selectedSession } = useSession();
  const [copied, setCopied] = useState(false);

  const examplePayload = {
    sessionId: selectedSession || "your-session-id",
    number: "919999999999",
    message: "Hello from API!",
  };

  const payloadString = JSON.stringify(examplePayload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(payloadString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white  rounded-lg">
      <h2 className="text-xl font-bold mb-4">Public API Usage</h2>
      <p>
        <span className="font-semibold">POST</span> to{" "}
        <code className="bg-gray-100 px-2 py-1 rounded">
          http://localhost:5000/send
        </code>
      </p>
      <p className="mt-4 font-semibold">Sample JSON Payload:</p>
      <div className="relative mt-2">
        <pre className="bg-black text-green-200 p-4 rounded text-sm overflow-x-auto">
          {payloadString}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
};

export default PublicApi;
