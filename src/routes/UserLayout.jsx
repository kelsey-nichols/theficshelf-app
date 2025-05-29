import React, { useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { Menu, X } from "lucide-react";

const UserLayout = () => {
  const { signOut } = UserAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate("/");
    } catch (err) {
      console.error("Sign out failed:", err.message);
    }
  };

  const goToProfile = () => {
    setMenuOpen(false);
    navigate("/user");
  };

  const goToBookmarkedShelves = () => {
    setMenuOpen(false);
    navigate("/user/bookmarked-shelves");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#d3b7a4] text-[#202d26] font-serif relative">
      {/* Menu Button top right */}
      <button
        onClick={() => setMenuOpen(true)}
        aria-label="Open menu"
        className="absolute top-6 right-6 text-[#202d26] bg-transparent focus:outline-none z-50"
      >
        <Menu size={28} />
      </button>

      {/* Slide-over menu */}
      {menuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setMenuOpen(false)}
          />
          {/* Menu Panel */}
          <nav className="fixed top-0 right-0 h-full w-64 bg-[#d3b7a4] shadow-lg flex flex-col p-6 z-50">
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="self-end mb-6 text-[#202d26] bg-transparent focus:outline-none"
            >
              <X size={28} />
            </button>

            {/* Profile Button */}
            <button
              onClick={goToProfile}
              className="text-[#202d26] text-left py-2 px-3 rounded hover:bg-[#202d26] hover:text-[#d3b7a4] transition"
            >
              Profile
            </button>

            <button
              onClick={goToBookmarkedShelves}
              className="text-[#202d26] text-left py-2 px-3 rounded hover:bg-[#202d26] hover:text-[#d3b7a4] transition"
            >
              Bookmarked Shelves
            </button>

            <button
              onClick={handleSignOut}
              className="mt-auto border border-[#202d26] text-[#202d26] px-4 py-2 rounded hover:bg-[#202d26] hover:text-[#d3b7a4] transition"
            >
              Sign Out
            </button>
          </nav>
        </>
      )}

      {/* Main content */}
      <main className="flex-grow p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default UserLayout;
