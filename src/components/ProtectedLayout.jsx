import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import MobileNavbar from "./MobileNavbar";
import {
  LibraryBig,
  Search,
  BookmarkPlus,
  Newspaper,
  User,
} from "lucide-react";

const tabs = [
  { id: "bookshelf", icon: LibraryBig, label: "Bookshelf", path: "/bookshelf" },
  { id: "discover", icon: Search, label: "Discover", path: "/discover" },
  { id: "add-fic", icon: BookmarkPlus, label: "Add Fic", path: "/add-fic" },
  { id: "feed", icon: Newspaper, label: "Feed", path: "/feed" },
  { id: "user", icon: User, label: "User", path: "/user" },
];

export default function ProtectedLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const activeColor = "#886146";
  const inactiveColor = "#d3b7a4";

  return (
    <>
      <Navbar />

      <MobileNavbar onToggle={() => setMobileOpen(!mobileOpen)} />

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed top-0 left-0 w-64 h-full bg-[#202d26] z-40 shadow-lg p-4">
          <button
            onClick={() => setMobileOpen(false)}
            className="text-[#d3b7a4] mb-6"
          >
            ✕ Close
          </button>

          {tabs.map(({ id, icon: Icon, label, path }) => {
            const isActive = location.pathname === path;

            return (
              <button
                key={id}
                onClick={() => {
                  navigate(path);
                  setMobileOpen(false);
                }}
                className={`flex items-center px-4 py-3 rounded-xl mb-2 w-full text-left ${
                  isActive ? "bg-[#3b4c43]" : "hover:bg-[#2e3a34]"
                }`}
                style={{ color: isActive ? activeColor : inactiveColor }}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="text-md font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content */}
      <div className="pt-16 md:pt-0 md:pl-64 transition-all">
        <Outlet />
      </div>
    </>
  );
}