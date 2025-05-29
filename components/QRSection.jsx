import React from "react";

const QRSection = ({ qrCode, loading, createSession }) => (
  <div>
    <h3 className="text-lg font-semibold mb-2">Create New Session</h3>
    <button
      onClick={createSession}
      className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
    >
      {loading ? "Waiting for QR..." : "Create Session"}
    </button>
    {qrCode && (
      <>
        <p>Scan QR in WhatsApp</p>
        <img src={qrCode} alt="QR Code" className="w-40 mt-2" />
      </>
    )}
  </div>
);

export default QRSection;
