import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  const links = [
    { path: "/", label: "Home" },
    { path: "/send", label: "Send Message" },
    { path: "/bulk", label: "Bulk Message" },
    { path: "/api", label: "Public API" },
  ];

  return (
    <div className=" fixed h-svh w-64 bg-white border-r p-4">
      <h2 className="text-xl font-bold mb-6">WhatsApp Sender</h2>
      <nav className="space-y-4">
        {links.map(({ path, label }) => (
          <Link
            key={path}
            to={path}
            className={`block px-3 py-2 rounded hover:bg-gray-100 ${
              location.pathname === path ? "bg-gray-200 font-medium" : ""
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;