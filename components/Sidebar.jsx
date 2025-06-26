import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FiHome, FiSend, FiInbox, FiUsers, FiCode } from "react-icons/fi"; // Import icons

const Sidebar = () => {
  const location = useLocation();

  const links = [
    { path: "/", label: "Home", icon: <FiHome /> },
    { path: "/send", label: "Send Message", icon: <FiSend /> },
    { path: "/receive", label: "Receive Message", icon: <FiInbox /> },
    { path: "/bulk", label: "Bulk Message", icon: <FiUsers /> },
    { path: "/api", label: "Public API", icon: <FiCode /> },
  ];

  return (
    <div className="fixed h-svh w-64 bg-white border-r p-4">
      <h2 className="text-xl font-bold mb-6">WhatsApp Sender</h2>
      <nav className="space-y-4">
        {links.map(({ path, label, icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-3 px-3 py-2 rounded  sh ${
              location.pathname === path
                ? "bg-green-600 font-medium text-white shadow-md"
                : ""
            }`}
          >
            {icon}
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
