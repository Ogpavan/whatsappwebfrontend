import React from "react";

const ApiInfo = ({ selectedSession, copyToClipboard, copySuccess }) => (
  <div>
    <h3 className="text-lg font-semibold mb-2">API Usage</h3>
    <p>POST to:</p>
    <code>http://localhost:5000/send</code>
    <ul className="list-disc list-inside my-2">
      <li><strong>sessionId</strong>: string</li>
      <li><strong>number</strong>: phone number (e.g. 91XXXXXXXXXX)</li>
      <li><strong>message</strong>: optional text or caption</li>
      <li><strong>media</strong>: file (optional)</li>
    </ul>
    <button onClick={copyToClipboard} className="bg-gray-700 text-white px-3 py-1 rounded">
      Copy Sample JSON
    </button>
    {copySuccess && (
      <p className="text-green-600 mt-1">{copySuccess}</p>
    )}
  </div>
);

export default ApiInfo;
