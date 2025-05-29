import React from "react";

const MessageForm = ({
  number,
  setNumber,
  message,
  setMessage,
  media,
  setMedia,
  send,
  selectedSession
}) => (
  <div>
    <h3 className="text-lg font-semibold mb-2">Send Message or Media</h3>
    <input
      className="border p-2 w-full mb-2"
      type="text"
      placeholder="Receiver's phone number"
      value={number}
      onChange={(e) => setNumber(e.target.value)}
    />
    <textarea
      className="border p-2 w-full mb-2"
      placeholder="Text message (optional caption)"
      value={message}
      onChange={(e) => setMessage(e.target.value)}
    />
    <input
      className="mb-2"
      type="file"
      onChange={(e) => setMedia(e.target.files[0])}
      accept="*"
    />
    <button
      onClick={send}
      disabled={!selectedSession}
      className="bg-green-600 text-white px-4 py-2 rounded"
    >
      Send
    </button>
  </div>
);

export default MessageForm;
