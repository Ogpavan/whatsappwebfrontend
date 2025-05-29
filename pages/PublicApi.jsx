import React from "react";

const PublicApi = () => {
  const examplePayload = {
    sessionId: "your-session-id",
    number: "919999999999",
    message: "Hello from API!",
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Public API Usage</h2>
      <p>POST to <code>http://localhost:5000/send</code></p>
      <p className="mt-2">Sample JSON:</p>
      <pre className="bg-gray-100 p-4 rounded mt-2">
        {JSON.stringify(examplePayload, null, 2)}
      </pre>
    </div>
  );
};

export default PublicApi;
