import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  MessageCircle,
  Plus,
  Users,
  Smartphone,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  QrCode,
} from "lucide-react";
import { useAuth } from "../context/AuthContext"; // Add this import

const Home = () => {
  const { user } = useAuth(); // Add this line
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [showQrModal, setShowQrModal] = useState(false);
  const [error, setError] = useState("");
  const prevSessionsRef = useRef([]);

  const fetchSessions = async () => {
    if (!user || !user.uid) return; // Prevent request if user is not ready
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/sessions`, {
        params: { userId: user.uid },
      });
      setSessions(res.data.sessions || []);
      setError("");
    } catch (err) {
      console.error("Error fetching sessions", err);
      setError(
        "Failed to fetch sessions. Please check if the server is running."
      );
      setSessions([]);
    }
  };

  useEffect(() => {
    if (!user) return; // Wait for user to be loaded
    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const createSession = async () => {
    setLoading(true);
    setQrCode(""); // Reset QR code
    setError("");
    setShowQrModal(true); // Show the modal instantly

    try {
      console.log("Creating session...");
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/create-session`,
        {
          userId: user.uid, // Pass userId here
        }
      );
      if (res.data.qr) {
        setQrCode(res.data.qr); // Set the QR code once generated
      } else {
        setError("No QR code received from server");
      }
      await fetchSessions();
    } catch (err) {
      console.error("Error creating session", err);
      setError("Failed to create session. Please try again.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const deleteSession = async (sessionId) => {
    if (window.confirm("Are you sure you want to disconnect this session?")) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/logout-and-delete`, {
          sessionId: sessionId,
        });
        await fetchSessions();
        setError("");
      } catch (err) {
        console.error("Error deleting session", err);
        setError("Failed to delete session. Please try again.");
      }
    }
  };

  const deriveStatus = (session) => {
    if (/^\d{12}$/.test(session.phoneNumber)) return "connected";
    if (session.pushname && session.pushname.toLowerCase() !== "unknown")
      return "connected";
    return "disconnected";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "idle":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-700 border-green-200";
      case "idle":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-red-100 text-red-700 border-red-200";
    }
  };

  useEffect(() => {
    // Find if a new session is connected (with a valid phone number)
    const connected = sessions.find((s) => /^\d{12}$/.test(s.phoneNumber));

    // Check if a new session was added
    const prevSessions = prevSessionsRef.current;
    const prevConnected = prevSessions.find((s) =>
      /^\d{12}$/.test(s.phoneNumber)
    );

    if (showQrModal && connected && !prevConnected) {
      // Only close if a new connection appeared
      const timer = setTimeout(() => {
        setShowQrModal(false);
      }, 1500); // 1.5s delay so user can see the modal close

      return () => clearTimeout(timer);
    }

    // Update previous sessions ref
    prevSessionsRef.current = sessions;
  }, [sessions, showQrModal]);

  return (
    <div className=" bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]   p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-100 rounded-md">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {sessions.length}
              </span>
            </div>
            <h3 className="text-gray-700 font-medium mt-3">Total Sessions</h3>
            <p className="text-gray-500 text-sm">Connected devices</p>
          </div>

          <div className="bg-white rounded-xl shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]   p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {
                  sessions.filter(
                    (s) => s.status === "active" || s.status === "connected"
                  ).length
                }
              </span>
            </div>
            <h3 className="text-gray-700 font-medium mt-3">Active Now</h3>
            <p className="text-gray-500 text-sm">Ready to receive</p>
          </div>

          <div className="bg-white rounded-xl shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]   p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {
                  sessions.filter(
                    (s) => s.status === "idle" || s.status === "disconnected"
                  ).length
                }
              </span>
            </div>
            <h3 className="text-gray-700 font-medium mt-3">Idle</h3>
            <p className="text-gray-500 text-sm">Inactive sessions</p>
          </div>

          <div className="bg-white rounded-xl shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]   p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">99.9%</span>
            </div>
            <h3 className="text-gray-700 font-medium mt-3">Uptime</h3>
            <p className="text-gray-500 text-sm">System reliability</p>
          </div>
        </div>

        <div className="flex  gap-8">
          {/* Session Creation Panel */}

          {/* Active Sessions Panel */}
          <div className="lg:col-span-2 w-full ">
            <div className="bg-white rounded-2xl shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] p-6 ">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Active Sessions ({sessions.length})
              </h2>

              {sessions.length > 0 ? (
                <div
                  className="
          space-y-4
          max-h-[40vh]
          overflow-y-auto
          pr-2
         
        "
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#d1d5db #fff",
                  }}
                >
                  {sessions.map((session, index) => (
                    <div
                      key={session.sessionId}
                      className="p-4 rounded-xl hover:border-gray-300 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold text-lg">
                            {session.pushname?.charAt(0) || "?"}
                          </div>
                          <div>
                            <h3 className="text-gray-900 font-semibold">
                              {session.pushname || "Unknown User"}
                            </h3>
                            <p className="text-gray-500 text-sm">
                              {session.phoneNumber || "No number available"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div
                            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              deriveStatus(session)
                            )}`}
                          >
                            {getStatusIcon(deriveStatus(session))}
                            <span className="capitalize">
                              {deriveStatus(session)}
                            </span>
                          </div>

                          <button
                            onClick={() => deleteSession(session.sessionId)}
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-gray-900 text-lg font-medium mb-2">
                    No Active Sessions
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Create your first session to start managing WhatsApp
                    communications for your business
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-1 min-w-sm">
            <div className="bg-white rounded-2xl shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]   p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-green-600" />
                Create New Session
              </h2>

              <button
                onClick={createSession}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2 mb-6"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Generating QR...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Generate QR Code</span>
                  </>
                )}
              </button>

              <div className="bg-gray-50 rounded-xl p-4  ">
                <h3 className="text-gray-900 font-medium mb-3">
                  How to connect:
                </h3>
                <ol className="text-gray-600 text-sm space-y-2">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                      1
                    </span>
                    Click "Generate QR Code"
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                      2
                    </span>
                    Open WhatsApp on your phone
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                      3
                    </span>
                    Go to Settings → Linked Devices
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                      4
                    </span>
                    Scan the QR code
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Scan QR Code
              </h3>
              <p className="text-gray-600 mb-6">
                Use your WhatsApp mobile app to scan this code
              </p>

              <div className="bg-gray-50 rounded-xl p-6 mb-6 border-2 border-dashed border-gray-300">
                {qrCode ? (
                  <img
                    src={qrCode}
                    alt="QR Code"
                    className="w-full h-auto max-w-[200px] mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center mx-auto">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              <div className="text-left bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <strong className="text-gray-900">Instructions:</strong>
                <ol className="mt-2 space-y-1 ml-4 list-decimal">
                  <li>Open WhatsApp on your phone</li>
                  <li>Go to Settings → Linked Devices</li>
                  <li>Tap "Link a Device"</li>
                  <li>Point your camera at this QR code</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
